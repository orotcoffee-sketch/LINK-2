"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { authErrorMessage } from "../data/auth";
import { showToast } from "../data/toast";
import { authButtonClass, authInputClass } from "./AuthCard";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!password || !passwordConfirm) {
      showToast("모든 정보를 입력해주세요.", "error");
      return;
    }
    if (password !== passwordConfirm) {
      showToast("비밀번호가 일치하지 않습니다.", "error");
      return;
    }
    setBusy(true);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) {
        showToast(authErrorMessage(error, "비밀번호를 변경하지 못했습니다. 다시 시도해주세요."), "error");
        return;
      }
      showToast("비밀번호가 변경되었습니다.");
      router.push("/login");
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
          type="password"
          name="password"
          autoComplete="new-password"
          aria-label="새 비밀번호"
          placeholder="새 비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={authInputClass}
        />
        <input
          type="password"
          name="passwordConfirm"
          autoComplete="new-password"
          aria-label="새 비밀번호 확인"
          placeholder="새 비밀번호 확인"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          className={authInputClass}
        />
      </div>
      <button type="submit" disabled={busy} className={authButtonClass}>
        비밀번호 변경
      </button>
    </form>
  );
}
