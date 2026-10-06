"use client";

import { useEffect, useState } from "react";
import { dismissToast, getToast, subscribeToast } from "../data/toast";
import type { Toast } from "../data/toast";

export default function ToastHost() {
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => subscribeToast(() => setToast(getToast())), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismissToast, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div
      role={toast?.kind === "error" ? "alert" : "status"}
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2"
    >
      {toast && (
        <div className="toast-in card flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium text-[var(--text)]">
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${
              toast.kind === "error"
                ? "bg-[var(--error)]"
                : "bg-[var(--success)]"
            }`}
          />
          {toast.message}
        </div>
      )}
    </div>
  );
}
