"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { authErrorMessage } from "../data/auth";
import { showToast } from "../data/toast";
import { authButtonClass, authInputClass } from "./AuthCard";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!email.trim()) {
      showToast("이메일을 입력해주세요.", "error");
      return;
    }
    setBusy(true);
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) {
        showToast(authErrorMessage(error, "요청 중 오류가 발생했습니다. 다시 시도해주세요."), "error");
        return;
      }
      showToast("비밀번호 재설정 이메일을 보냈습니다.");
    } catch {
      showToast("네트워크 연결을 확인해주세요.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
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
      <button type="submit" disabled={busy} className={authButtonClass}>
        비밀번호 재설정 이메일 보내기
      </button>
      <p className="text-center text-sm">
        <Link href="/login" className="font-bold text-[var(--accent)] underline-offset-2 hover:underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </form>
  );
}
