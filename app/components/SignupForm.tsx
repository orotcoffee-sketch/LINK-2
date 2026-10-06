"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { authErrorMessage } from "../data/auth";
import { showToast } from "../data/toast";
import { authButtonClass, authInputClass } from "./AuthCard";

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const filled = email.trim() !== "" && password !== "" && passwordConfirm !== "";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    // disabled 상태만 믿지 않고 처리 함수에서도 다시 검증한다.
    if (!email.trim() || !password || !passwordConfirm) {
      showToast("모든 정보를 입력해주세요.", "error");
      return;
    }
    if (password !== passwordConfirm) {
      showToast("비밀번호가 일치하지 않습니다.", "error");
      return;
    }
    setBusy(true);
    try {
      const { error } = await createClient().auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        showToast(authErrorMessage(error, "회원가입 중 오류가 발생했습니다. 다시 시도해주세요."), "error");
        return;
      }
      showToast("회원가입이 완료되었습니다. 이메일을 확인해주세요.");
      router.push("/");
    } catch {
      showToast("네트워크 연결을 확인해주세요.", "error");
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
          autoComplete="new-password"
          aria-label="비밀번호"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={authInputClass}
        />
        <input
          type="password"
          name="passwordConfirm"
          autoComplete="new-password"
          aria-label="비밀번호 확인"
          placeholder="비밀번호 확인"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          className={authInputClass}
        />
      </div>
      <button type="submit" disabled={!filled || busy} className={authButtonClass}>
        회원가입
      </button>
      <p className="text-center text-sm text-[var(--text-sub)]">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-bold text-[var(--accent)] underline-offset-2 hover:underline">
          로그인
        </Link>
      </p>
    </form>
  );
}
