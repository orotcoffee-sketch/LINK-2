"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth, isAdmin, signOut, subscribeAuth } from "../data/auth";
import type { AuthState } from "../data/auth";
import { showToast } from "../data/toast";
import AddLinkButton from "./AddLinkButton";
import NewFolderButton from "./NewFolderButton";

const subBtn =
  "btn-sub inline-flex h-9 items-center rounded-xl px-3.5 text-sm font-medium text-[var(--text)]";

// 로그인/role 상태에 따라 헤더 오른쪽 UI를 바꾼다. 표시용이며 실제 권한은 DB RLS가 막는다.
export function useAuth(): AuthState {
  const [auth, setAuth] = useState<AuthState>({ ready: false, signedIn: false, email: null, displayName: "", verified: false, role: null });
  useEffect(() => {
    const sync = () => setAuth(getAuth());
    sync();
    return subscribeAuth(sync);
  }, []);
  return auth;
}

export default function AuthControls() {
  const auth = useAuth();
  if (!auth.ready) return null;

  if (!auth.signedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className={subBtn}>
          로그인
        </Link>
        <Link href="/signup" className="btn inline-flex h-9 items-center rounded-xl bg-[var(--accent)] px-3.5 text-sm font-medium text-white">
          회원가입
        </Link>
      </div>
    );
  }

  const logout = async () => {
    await signOut();
    showToast("로그아웃했어요");
  };

  return (
    <div className="flex items-center gap-2">
      {isAdmin(auth) ? (
        <>
          <span className="hidden h-9 items-center rounded-xl bg-[var(--active-bg)] px-3 text-[13px] font-medium text-[var(--text)] sm:inline-flex">
            관리자 모드
          </span>
          <NewFolderButton />
          <AddLinkButton />
        </>
      ) : (
        <span className="hidden max-w-[12rem] truncate text-sm text-[var(--text-sub)] sm:inline">
          {auth.displayName}
        </span>
      )}
      <button type="button" onClick={logout} className={subBtn}>
        로그아웃
      </button>
    </div>
  );
}
