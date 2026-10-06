import type { ReactNode } from "react";
import Logo from "./Logo";

// 로그인/회원가입 공통 레이아웃: Header·Sidebar 없이 카드만 화면 중앙에 둔다. (UI 전용)
export default function AuthCard({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center p-5">
      <div className="card flex w-full max-w-sm flex-col gap-6 rounded-3xl p-7 sm:p-10">
        <div className="flex justify-center">
          <Logo />
        </div>
        {children}
      </div>
    </main>
  );
}

export const authInputClass =
  "field w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-3 text-base text-[var(--text)]";
export const authButtonClass =
  "btn min-h-11 w-full rounded-xl bg-[var(--accent)] px-5 py-3 text-base font-semibold text-white";
