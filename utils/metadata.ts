import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// 서버 전용: 북마크 URL의 title / description / 대표 이미지를 읽는다.
// 사용자 쿠키·인증 헤더는 외부로 보내지 않는다.

export type PageMetadata = {
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  status: number | null;
};

const TIMEOUT_MS = 6000;
const MAX_BYTES = 512 * 1024;
const MAX_REDIRECTS = 4;
const UA = "Mozilla/5.0 (compatible; LinkBookmarkBot/1.0)";

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast / reserved
  );
}

function isPrivateIPv6(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === "::" || v === "::1") return true;
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  if (v.startsWith("::ffff:")) return true; // 16진 표기 IPv4-mapped는 보수적으로 차단
  return /^(fc|fd|fe[89ab])/.test(v) || v.startsWith("ff");
}

function isPrivateIp(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return isPrivateIPv4(ip);
  if (kind === 6) return isPrivateIPv6(ip);
  return true;
}

// http/https + 공인 IP로만 해석되는 호스트만 허용한다.
export async function assertSafeUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("invalid_url");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("blocked_protocol");
  if (url.username || url.password) throw new Error("blocked_credentials");
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("blocked_host");
  }
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error("blocked_host");
    return url;
  }
  const addrs = await lookup(host, { all: true });
  if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) throw new Error("blocked_host");
  return url;
}

async function readLimited(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    total += value.length;
  }
  await reader.cancel().catch(() => {});
  const buf = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    buf.set(c, off);
    off += c.length;
  }
  return new TextDecoder("utf-8").decode(buf);
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function decode(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return out;
}

function absolute(value: string | undefined, base: URL): string | null {
  if (!value) return null;
  try {
    const u = new URL(decode(value), base);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function parseMetadata(html: string, base: URL): Omit<PageMetadata, "status"> {
  const head = html.slice(0, MAX_BYTES);
  const meta: Record<string, string> = {};
  for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attrs(m[0]);
    const key = (a.property ?? a.name ?? "").toLowerCase();
    if (key && a.content !== undefined && !(key in meta)) meta[key] = decode(a.content);
  }
  let favicon: string | null = null;
  for (const m of head.matchAll(/<link\b[^>]*>/gi)) {
    const a = attrs(m[0]);
    if (/(^|\s)(shortcut\s+)?icon(\s|$)|apple-touch-icon/i.test(a.rel ?? "") && a.href) {
      favicon = absolute(a.href, base);
      if (favicon) break;
    }
  }
  const titleTag = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const pick = (...vals: (string | undefined)[]) => vals.find((v) => v && v.trim()) ?? null;
  return {
    title: pick(meta["og:title"], meta["twitter:title"], titleTag ? decode(titleTag) : undefined),
    description: pick(meta["og:description"], meta["twitter:description"], meta["description"]),
    image: absolute(
      pick(meta["og:image"], meta["og:image:url"], meta["twitter:image"], meta["twitter:image:src"]) ?? undefined,
      base,
    ),
    favicon,
  };
}

export async function fetchMetadata(raw: string): Promise<PageMetadata> {
  let url = await assertSafeUrl(raw);
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(url, {
      redirect: "manual",
      signal,
      credentials: "omit",
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      await res.body?.cancel().catch(() => {});
      if (!loc) throw new Error("bad_redirect");
      url = await assertSafeUrl(new URL(loc, url).toString()); // redirect 대상도 다시 검증
      continue;
    }
    const empty = { title: null, description: null, image: null, favicon: null };
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/text\/html|application\/xhtml/i.test(type)) {
      await res.body?.cancel().catch(() => {});
      return { ...empty, status: res.status };
    }
    const parsed = parseMetadata(await readLimited(res), url);
    return { ...parsed, status: res.status };
  }
  throw new Error("too_many_redirects");
}
