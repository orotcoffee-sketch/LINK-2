import { createClient } from "@/utils/supabase/client";
import type { Bookmark, Folder } from "./types";
import { showToast } from "./toast";

// Supabase의 folders / bookmarks 테이블이 데이터의 원본이다.
// 이 모듈은 클라이언트에서 처음 접근할 때 한 번 조회해 메모리에 두고, 변경 후에는 다시 조회한다.
// localStorage에는 화면 표시 순서(폴더·링크 정렬)만 저장하며 데이터 원본으로 쓰지 않는다.
const ORDER_KEY = "link-app-order-v2";

let supabase: ReturnType<typeof createClient> | null = null;
const db = () => (supabase ??= createClient());

let folders: Folder[] = [];
let bookmarks: Bookmark[] = [];
let loaded = false;
let started = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

type FolderRow = { id: number; name: string };
type BookmarkRow = {
  id: number;
  title: string | null;
  url: string;
  description: string | null;
  thumbnail_url: string | null;
  folder_id: number | null;
  created_at: string;
};

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

async function refresh(): Promise<string | null> {
  const [f, b] = await Promise.all([
    db().from("folders").select("id, name").order("id"),
    db()
      .from("bookmarks")
      .select("id, title, url, description, thumbnail_url, folder_id, created_at")
      .order("created_at", { ascending: false }),
  ]);
  const error = f.error ?? b.error;
  if (error) {
    showToast("데이터를 불러오지 못했어요", "error");
    return error.message;
  }
  folders = (f.data as FolderRow[]).map((r) => ({ id: String(r.id), name: r.name }));
  bookmarks = (b.data as BookmarkRow[]).map((r) => ({
    id: String(r.id),
    title: r.title ?? hostname(r.url),
    url: r.url,
    description: r.description ?? "",
    thumbnailUrl: r.thumbnail_url ?? "",
    folderId: r.folder_id === null ? "" : String(r.folder_id),
    createdAt: r.created_at.slice(0, 10),
  }));
  loaded = true;
  notify();
  return null;
}

function hydrate(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      folderOrder = d.folderOrder ?? [];
      linkOrder = d.linkOrder ?? {};
    }
  } catch {
    // 손상된 순서 데이터는 무시한다.
  }
  void refresh();
}

function persistOrder(): void {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify({ folderOrder, linkOrder }));
  } catch {
    // 저장 공간이 없거나 차단된 경우 메모리 상태만 유지한다.
  }
}

export function isLoaded(): boolean {
  hydrate();
  return loaded;
}

export function subscribeFolders(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// 변경 작업 공통: 성공하면 다시 조회해 화면을 갱신한다. 실패하면 오류 메시지를 돌려준다.
async function mutate(run: () => PromiseLike<{ error: { message: string } | null }>): Promise<string | null> {
  const { error } = await run();
  if (error) return error.message;
  return refresh();
}

// ── 폴더 ──────────────────────────────────────────────

export function getVisibleFolders(): Folder[] {
  hydrate();
  return sortByOrder(folders);
}

export function addFolder(name: string): Promise<string | null> {
  hydrate();
  return mutate(() => db().from("folders").insert({ name }));
}

export function renameFolder(id: string, raw: string): Promise<string | null> {
  hydrate();
  return mutate(() => db().from("folders").update({ name: raw.trim() }).eq("id", Number(id)));
}

// 폴더를 지우면 DB의 ON DELETE SET NULL로 연결된 북마크의 folder_id가 비워진다.
export async function removeFolder(id: string): Promise<string | null> {
  hydrate();
  if (selectedFolderId === id) selectedFolderId = "all";
  return mutate(() => db().from("folders").delete().eq("id", Number(id)));
}

// 폴더 이름 검증: 오류 메시지 또는 null. excludeId는 이름을 수정 중인 폴더.
export function validateFolderName(raw: string, excludeId?: string): string | null {
  const name = raw.trim();
  if (!name) return "폴더 이름을 입력해주세요.";
  const dup = getVisibleFolders().some((f) => f.id !== excludeId && f.name === name);
  return dup ? "이미 있는 폴더 이름이에요." : null;
}

// 선택된 폴더 ("all" = 전체). 저장하지 않는다 (새로고침 시 All).
let selectedFolderId = "all";

export function getSelectedFolderId(): string {
  hydrate();
  return selectedFolderId;
}

export function selectFolder(id: string): void {
  hydrate();
  selectedFolderId = id;
  notify();
}

// ── 북마크 ────────────────────────────────────────────

export function getEffectiveBookmarks(): Bookmark[] {
  hydrate();
  return bookmarks;
}

type FetchedMeta = { title: string | null; description: string | null; image: string | null };

// 서버(/api/metadata)에서 title / description / 대표 이미지를 가져온다. 실패해도 저장은 계속한다.
async function fetchMeta(url: string): Promise<FetchedMeta> {
  try {
    const res = await fetch("/api/metadata", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { title: null, description: null, image: null };
    return (await res.json()) as FetchedMeta;
  } catch {
    return { title: null, description: null, image: null };
  }
}

export async function saveBookmark(url: string, folderId: string): Promise<string | null> {
  hydrate();
  const meta = await fetchMeta(url);
  return mutate(() =>
    db()
      .from("bookmarks")
      .insert({
        title: meta.title?.slice(0, 200) || hostname(url),
        url,
        description: meta.description?.slice(0, 500) || null,
        thumbnail_url: meta.image || null,
        folder_id: folderId ? Number(folderId) : null,
      }),
  );
}

// 링크 수정: URL과 폴더만 바꾼다.
export function editBookmark(
  id: string,
  edit: { url: string; folderId: string },
): Promise<string | null> {
  hydrate();
  return mutate(() =>
    db()
      .from("bookmarks")
      .update({ url: edit.url, folder_id: edit.folderId ? Number(edit.folderId) : null })
      .eq("id", Number(id)),
  );
}

export function removeBookmark(id: string): Promise<string | null> {
  hydrate();
  return mutate(() => db().from("bookmarks").delete().eq("id", Number(id)));
}

// URL 검증: 오류 메시지 또는 null. excludeId는 수정 중인 링크.
export function validateUrl(raw: string, excludeId?: string): string | null {
  const value = raw.trim();
  if (!value) return "링크 주소를 입력해주세요.";
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return "올바른 URL 형식이 아니에요. (예: https://example.com)";
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "http:// 또는 https://로 시작하는 주소만 저장할 수 있어요.";
  }
  const normalize = (u: string) => u.replace(/\/+$/, "").toLowerCase();
  const dup = getEffectiveBookmarks().some(
    (b) => b.id !== excludeId && normalize(b.url) === normalize(value),
  );
  return dup ? "이미 저장된 링크예요." : null;
}

// ── 표시 순서 (화면 설정, localStorage) ────────────────

// 폴더 표시 순서: 폴더 id 배열. 목록에 없는 폴더는 id 순서대로 맨 뒤에 둔다.
let folderOrder: string[] = [];

export function loadFolderOrder(): string[] {
  hydrate();
  return folderOrder;
}

export function sortByOrder(list: Folder[]): Folder[] {
  const rank = (id: string) => {
    const i = folderOrder.indexOf(id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...list].sort((a, b) => rank(a.id) - rank(b.id));
}

export function setFolderOrder(ids: string[]): void {
  hydrate();
  folderOrder = ids;
  persistOrder();
  notify();
}

// 폴더별 링크 표시 순서: { folderId: linkId[] }. 일반 폴더에서만 사용하고, 목록에 없는 링크는 맨 뒤에 둔다.
let linkOrder: Record<string, string[]> = {};

export function sortLinksInFolder(list: Bookmark[], folderId: string): Bookmark[] {
  hydrate();
  const order = linkOrder[folderId] ?? [];
  const rank = (id: string) => {
    const i = order.indexOf(id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  // 기본 순서는 최신 생성일순이고, 저장된 수동 순서가 있으면 그 위치를 따른다.
  return [...list]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .sort((a, b) => rank(a.id) - rank(b.id));
}

export function setLinkOrder(folderId: string, ids: string[]): void {
  hydrate();
  linkOrder = { ...linkOrder, [folderId]: ids };
  persistOrder();
  notify();
}
