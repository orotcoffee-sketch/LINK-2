"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { authErrorMessage } from "../data/auth";
import { showToast } from "../data/toast";
import { authButtonClass, authInputClass } from "./AuthCard";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [kakaoBusy, setKakaoBusy] = useState(false);

  // 카카오 로그인 실패 시 /auth/callback이 /login?error=callback 으로 돌려보낸다.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "callback") {
      showToast("카카오 로그인을 완료하지 못했습니다. 다시 시도해주세요.", "error");
      router.replace("/login");
    }
  }, [router]);

  async function handleKakao() {
    if (busy || kakaoBusy) return;
    setKakaoBusy(true);
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch {
      showToast("카카오 로그인을 시작하지 못했습니다. 다시 시도해주세요.", "error");
      setKakaoBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) {
      showToast("이메일과 비밀번호를 입력해주세요.", "error");
      return;
    }
    setBusy(true);
    try {
      const { error } = await createClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        showToast(authErrorMessage(error, "로그인 중 오류가 발생했습니다. 다시 시도해주세요."), "error");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      showToast("로그인 중 오류가 발생했습니다. 다시 시도해주세요.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <input
          type="email"
          name="email"
          autoComplete="email"
          aria-label="이메일"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={authInputClass}
        />
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          aria-label="비밀번호"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={authInputClass}
        />
      </div>
      <Link
        href="/forgot-password"
        className="-mt-2 self-end text-sm text-[var(--text-sub)] underline-offset-2 hover:underline"
      >
        비밀번호 찾기
      </Link>
      <button type="submit" disabled={busy || kakaoBusy} className={authButtonClass}>
        로그인
      </button>
      <button
        type="button"
        onClick={handleKakao}
        disabled={busy || kakaoBusy}
        className="btn-kakao flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-5 py-3 text-base font-semibold text-[#191919]"
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="#191919">
          <path d="M9 1.5C4.58 1.5 1 4.31 1 7.78c0 2.24 1.5 4.21 3.76 5.32l-.96 3.5c-.08.3.26.54.52.37l4.17-2.77c.17.01.34.02.51.02 4.42 0 8-2.81 8-6.44S13.42 1.5 9 1.5z" />
        </svg>
        카카오 로그인
      </button>
      <p className="text-center text-sm text-[var(--text-sub)]">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="font-bold text-[var(--accent)] underline-offset-2 hover:underline">
          회원가입
        </Link>
      </p>
    </form>
  );
}
