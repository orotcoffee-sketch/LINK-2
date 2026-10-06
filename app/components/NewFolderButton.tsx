"use client";

import { useState } from "react";
import { addFolder } from "../data/storage";
import { showToast } from "../data/toast";

export default function NewFolderButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const close = () => {
    setOpen(false);
    setName("");
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const error = await addFolder(trimmed);
    if (error) {
      showToast("폴더를 만들지 못했어요", "error");
      return;
    }
    showToast("폴더를 만들었어요");
    close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-sub inline-flex h-9 items-center rounded-xl px-3.5 text-sm font-medium text-[var(--text)]"
      >
        + 새폴더
      </button>
      {open && (
        <div
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-5"
          onClick={close}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-folder-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            onKeyDown={(e) => e.key === "Escape" && close()}
            className="modal-panel card flex w-full max-w-sm flex-col gap-4 rounded-[20px] p-6"
          >
            <h2 id="new-folder-title" className="text-xl font-semibold leading-[1.4] text-[var(--text)]">
              새폴더
            </h2>
            <input
              autoFocus
              aria-label="폴더 이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="폴더 이름"
              className="field rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-3 text-base text-[var(--text)]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                className="btn-sub rounded-xl px-5 py-2.5 font-semibold text-[var(--text)]"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="btn rounded-xl bg-[var(--accent)] px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[var(--border)] disabled:text-[var(--text-sub)]"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
