import { createClient } from "@/utils/supabase/client";

// 로그인 상태와 role. 원본은 Supabase Auth 세션 + profiles.role 이고, 여기서는 화면용으로만 보관한다.
// 실제 쓰기 권한은 DB RLS가 판단한다.
export type AuthState = {
  ready: boolean;
  signedIn: boolean;
  email: string | null;
  // 헤더 표시용: email → Kakao 닉네임 → "사용자"
  displayName: string;
  verified: boolean;
  role: "member" | "admin" | null;
};

let state: AuthState = { ready: false, signedIn: false, email: null, displayName: "", verified: false, role: null };
let started = false;
const listeners = new Set<() => void>();

const set = (next: AuthState) => {
  state = next;
  listeners.forEach((fn) => fn());
};

async function load(): Promise<void> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) {
    set({ ready: true, signedIn: false, email: null, displayName: "", verified: false, role: null });
    return;
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const meta = user.user_metadata ?? {};
  const nickname = [meta.name, meta.nickname, meta.preferred_username, meta.full_name].find(
    (v): v is string => typeof v === "string" && v.trim() !== "",
  );
  set({
    ready: true,
    signedIn: true,
    email: user.email ?? null,
    displayName: user.email ?? (nickname || "사용자"),
    verified: !!user.email_confirmed_at,
    role: profile?.role === "admin" ? "admin" : "member",
  });
}

function start(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  void load();
  // 콜백 안에서 Supabase 호출을 await 하면 교착될 수 있어 다음 틱으로 미룬다.
  createClient().auth.onAuthStateChange(() => {
    setTimeout(() => void load(), 0);
  });
}

export function getAuth(): AuthState {
  start();
  return state;
}

export function subscribeAuth(fn: () => void): () => void {
  start();
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export const isAdmin = (s: AuthState) => s.role === "admin" && s.verified;

export async function signOut(): Promise<void> {
  await createClient().auth.signOut();
  await load();
}

// Supabase 오류를 사용자용 한국어 메시지로 바꾼다.
export function authErrorMessage(
  error: { message?: string; code?: string; status?: number } | null,
  fallback: string,
): string {
  const msg = (error?.message ?? "").toLowerCase();
  const code = error?.code ?? "";
  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) return "이메일 인증을 완료해주세요.";
  if (code === "invalid_credentials" || msg.includes("invalid login")) return "이메일 또는 비밀번호를 확인해주세요.";
  if (code === "email_address_invalid" || msg.includes("invalid format") || msg.includes("email address") && msg.includes("invalid"))
    return "올바른 이메일 주소를 입력해주세요.";
  if (code === "weak_password" || msg.includes("password should") || msg.includes("weak")) return "비밀번호 조건을 확인해주세요.";
  if (code === "user_already_exists" || msg.includes("already registered")) return "가입할 수 없는 이메일입니다. 다른 이메일을 사용하거나 로그인해주세요.";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || error?.status === 429)
    return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
  if (code === "same_password") return "이전과 다른 비밀번호를 입력해주세요.";
  if (msg.includes("fetch") || msg.includes("network")) return "네트워크 연결을 확인해주세요.";
  return fallback;
}

