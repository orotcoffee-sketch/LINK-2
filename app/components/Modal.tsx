"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  titleId: string;
  onClose: () => void;
  children: ReactNode;
};

export default function Modal({ title, titleId, onClose, children }: Props) {
  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-5"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="modal-panel card flex w-full max-w-sm flex-col gap-4 rounded-[20px] p-6"
      >
        <h2
          id={titleId}
          className="text-xl font-semibold leading-[1.4] text-[var(--text)]"
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
