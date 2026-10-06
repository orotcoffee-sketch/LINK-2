"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Bookmark, Folder } from "../data/types";
import {
  getEffectiveBookmarks,
  getVisibleFolders,
  renameFolder,
  validateFolderName,
  setFolderOrder,
  removeFolder,
  subscribeFolders,
} from "../data/storage";
import { showToast } from "../data/toast";
import { isAdmin } from "../data/auth";
import { useAuth } from "./AuthControls";
import Modal from "./Modal";
import SidebarItem from "./SidebarItem";
import { useReorderDrag } from "./useReorderDrag";

function PencilIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export default function FolderList() {
  const admin = isAdmin(useAuth());
  const [visible, setVisible] = useState<Folder[]>([]);
  const [links, setLinks] = useState<Bookmark[]>([]);
  const [target, setTarget] = useState<Folder | null>(null);
  const [renaming, setRenaming] = useState<Folder | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setVisible(getVisibleFolders());
      setLinks(getEffectiveBookmarks());
    };
    sync();
    return subscribeFolders(sync);
  }, []);

  function closeRename() {
    setRenaming(null);
    setRenameError(null);
  }

  async function handleRename(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!renaming) return;
    const name = new FormData(e.currentTarget).get("name");
    if (typeof name !== "string") return;
    // 이름이 그대로면 데이터를 바꾸지 않고 닫는다.
    if (name.trim() !== renaming.name) {
      const error = validateFolderName(name, renaming.id);
      if (error) {
        setRenameError(error);
        return;
      }
      const saveError = await renameFolder(renaming.id, name);
      if (saveError) {
        setRenameError("폴더 이름을 바꾸지 못했어요. 다시 시도해주세요.");
        return;
      }
    }
    closeRename();
  }

  const { itemProps } = useReorderDrag({
    group: "folder",
    ids: visible.map((f) => f.id),
    enabled: true,
    axis: "y",
    onReorder: setFolderOrder,
  });

  return (
    <>
      <ul className="flex flex-col gap-1">
        {visible.map((f) => (
          <li
            key={f.id}
            {...itemProps(f.id, "side-row relative rounded-xl")}
          >
            <SidebarItem label={f.name} folderId={f.id} count={links.filter((b) => b.folderId === f.id).length} />
            {admin && (
              <>
              <button
                type="button"
                data-no-drag
                aria-label={`${f.name} 폴더 이름 수정`}
                onClick={() => setRenaming(f)}
                className="row-action row-action-edit absolute right-10 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-sub)]"
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                data-no-drag
                aria-label={`${f.name} 폴더 삭제`}
                onClick={() => setTarget(f)}
                className="row-action absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-sub)]"
              >
                <TrashIcon />
              </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {renaming && (
        <Modal
          title="폴더 이름 수정"
          titleId="rename-folder-title"
          onClose={closeRename}
        >
          <form onSubmit={handleRename} noValidate className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <input
                name="name"
                autoFocus
                aria-label="폴더 이름"
                aria-invalid={renameError ? true : undefined}
                aria-describedby={renameError ? "rename-folder-error" : undefined}
                defaultValue={renaming.name}
                onChange={() => setRenameError(null)}
                placeholder="폴더 이름"
                className={`field rounded-xl border bg-[var(--card)] px-3.5 py-3 text-base text-[var(--text)] ${
                  renameError ? "border-[var(--error)]" : "border-[var(--border)]"
                }`}
              />
              {renameError && (
                <p
                  id="rename-folder-error"
                  role="alert"
                  className="text-[13px] leading-[1.4] text-[var(--error)]"
                >
                  {renameError}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeRename}
                className="btn-sub rounded-xl px-5 py-2.5 font-semibold text-[var(--text)]"
              >
                취소
              </button>
              <button
                type="submit"
                className="btn rounded-xl bg-[var(--accent)] px-5 py-2.5 font-semibold text-white"
              >
                저장
              </button>
            </div>
          </form>
        </Modal>
      )}
      {target && (
        <div
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-5"
          onClick={() => setTarget(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-folder-title"
            aria-describedby="delete-folder-desc"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === "Escape" && setTarget(null)}
            className="modal-panel card flex w-full max-w-sm flex-col gap-4 rounded-[20px] p-6"
          >
            <h2
              id="delete-folder-title"
              className="text-xl font-semibold leading-[1.4] text-[var(--text)]"
            >
              폴더 삭제
            </h2>
            <p
              id="delete-folder-desc"
              className="text-base text-[var(--text)]"
            >
              <strong className="font-bold">{target.name}</strong> 폴더를
              삭제할까요?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => setTarget(null)}
                className="btn-sub rounded-xl px-5 py-2.5 font-semibold text-[var(--text)]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={async () => {
                  const removeError = await removeFolder(target.id);
                  if (removeError) {
                    showToast("폴더를 삭제하지 못했어요", "error");
                    return;
                  }
                  showToast("폴더를 삭제했어요");
                  setTarget(null);
                }}
                className="btn-danger rounded-xl bg-[var(--error)] px-5 py-2.5 font-semibold text-white"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
