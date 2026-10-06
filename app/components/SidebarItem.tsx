"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getSelectedFolderId,
  selectFolder,
  subscribeFolders,
} from "../data/storage";

type Props = { label: string; folderId: string; count?: number };

export default function SidebarItem({ label, folderId, count }: Props) {
  const [selected, setSelected] = useState("all");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const sync = () => setSelected(getSelectedFolderId());
    sync();
    return subscribeFolders(sync);
  }, []);

  const active = selected === folderId;

  return (
    <button
      type="button"
      onClick={() => {
        selectFolder(folderId);
        // 링크 추가 화면 등 목록이 없는 페이지에서는 목록 화면으로 이동한다.
        if (pathname !== "/") router.push("/");
      }}
      aria-current={active ? "true" : undefined}
      className={`side-item flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium ${
        active
          ? "text-[var(--text)]"
          : "text-[var(--text)]"
      }`}
    >
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <span
          key={count}
          className="row-count count-pulse shrink-0 rounded-md bg-[var(--hover-bg)] px-1.5 text-[12px] font-medium leading-5 text-[var(--text-sub)] transition-opacity duration-200"
        >
          {count}
        </span>
      )}
    </button>
  );
}
