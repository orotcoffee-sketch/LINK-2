"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import type { Bookmark, Folder } from "../data/types";
import {
  editBookmark,
  getEffectiveBookmarks,
  getSelectedFolderId,
  getVisibleFolders,
  isLoaded,
  removeBookmark,
  setLinkOrder,
  sortLinksInFolder,
  subscribeFolders,
  validateUrl,
} from "../data/storage";
import { showToast } from "../data/toast";
import { isAdmin } from "../data/auth";
import { useAuth } from "./AuthControls";
import LinkCard from "./LinkCard";
import Modal from "./Modal";
import { useReorderDrag } from "./useReorderDrag";

export default function LinkGrid() {
  const admin = isAdmin(useAuth());
  const [all, setAll] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selected, setSelected] = useState("all");
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Bookmark | null>(null);

  useEffect(() => {
    const sync = () => {
      setAll(getEffectiveBookmarks());
      setFolders(getVisibleFolders());
      setSelected(getSelectedFolderId());
      setReady(isLoaded());
    };
    sync();
    return subscribeFolders(sync);
  }, []);

  const folderName = (id: string) =>
    folders.find((f) => f.id === id)?.name ?? "미분류";

  const scoped = all.filter(
    (b) => selected === "all" || b.folderId === selected,
  );
  const q = query.trim().toLowerCase();
  const matched = scoped.filter(
    (b) =>
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.url.toLowerCase().includes(q),
  );
  // All은 최신순, 일반 폴더는 저장된 수동 순서를 따른다.
  const items =
    selected === "all"
      ? [...matched].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : sortLinksInFolder(matched, selected);

  // 일반 폴더에서 검색어가 없을 때만 순서를 바꿀 수 있다.
  const { itemProps } = useReorderDrag({
    group: "link",
    ids: items.map((b) => b.id),
    enabled: selected !== "all" && !q,
    axis: "x",
    onReorder: (ids) => setLinkOrder(selected, ids),
  });

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      showToast("URL을 복사했어요");
    } catch {
      showToast("복사하지 못했어요", "error");
    }
  }

  function closeEdit() {
    setEditing(null);
    setEditError(null);
  }

  async function handleEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const data = new FormData(e.currentTarget);
    const url = data.get("url");
    const folderId = data.get("folderId");
    if (typeof url !== "string" || typeof folderId !== "string") return;
    const error = validateUrl(url, editing.id);
    if (error) {
      setEditError(error);
      return;
    }
    const saveError = await editBookmark(editing.id, { url: url.trim(), folderId });
    if (saveError) {
      setEditError("링크를 수정하지 못했어요. 다시 시도해주세요.");
      return;
    }
    showToast("링크를 수정했어요");
    closeEdit();
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-5 md:px-10 md:py-9">
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[var(--text)]">
            {selected === "all"
              ? "All"
              : (folders.find((f) => f.id === selected)?.name ?? "미분류")}
          </h1>
          {ready && (
            <p className="mt-1 text-sm text-[var(--text-sub)]">
              {items.length} {items.length === 1 ? "bookmark" : "bookmarks"}
            </p>
          )}
        </div>
        <div className="relative w-full sm:max-w-[480px]">
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
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--placeholder)]"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="링크 검색"
            placeholder="제목 또는 URL 검색"
            className="field w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] py-3 pl-10 pr-4 text-base text-[var(--text)]"
          />
        </div>
      </div>

      {!ready ? null : items.length === 0 ? (
        <div className="flex flex-1 items-start justify-center pt-16">
          <div className="flex w-full max-w-sm flex-col items-center gap-1.5 text-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="mb-1 text-[var(--placeholder)]"
            >
              <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
              <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
            </svg>
            {scoped.length === 0 ? (
              <>
                <h2 className="text-base font-semibold text-[var(--text)]">
                  아직 저장된 링크가 없어요
                </h2>
                {admin && (
                  <>
                    <p className="text-sm text-[var(--text-sub)]">
                      첫 링크를 저장해보세요.
                    </p>
                    <Link
                      href="/new"
                      className="btn mt-3 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      + 링크 추가
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <h2 className="text-base font-semibold text-[var(--text)]">
                  검색 결과가 없어요
                </h2>
                <p className="text-sm text-[var(--text-sub)]">
                  다른 키워드로 다시 검색해보세요.
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <ul key={selected} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <li key={b.id} {...itemProps(b.id, "card-enter flex")}>
              <LinkCard
                bookmark={b}
                folderName={folderName(b.folderId)}
                onCopy={() => handleCopy(b.url)}
                onEdit={admin ? () => setEditing(b) : undefined}
                onDelete={admin ? () => setDeleting(b) : undefined}
              />
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <Modal
          title="링크 수정"
          titleId="edit-link-title"
          onClose={closeEdit}
        >
          <form
            onSubmit={handleEdit}
            noValidate
            className="flex flex-col gap-3.5"
          >
            <div className="flex flex-col gap-1.5">
              <input
                type="url"
                name="url"
                autoFocus
                aria-label="링크 주소"
                aria-invalid={editError ? true : undefined}
                aria-describedby={editError ? "edit-url-error" : undefined}
                defaultValue={editing.url}
                onChange={() => setEditError(null)}
                placeholder="https://example.com"
                className={`field rounded-xl border bg-[var(--card)] px-3.5 py-3 text-base text-[var(--text)] ${
                  editError ? "border-[var(--error)]" : "border-[var(--border)]"
                }`}
              />
              {editError && (
                <p
                  id="edit-url-error"
                  role="alert"
                  className="text-[13px] leading-[1.4] text-[var(--error)]"
                >
                  {editError}
                </p>
              )}
            </div>
            <select
              name="folderId"
              aria-label="폴더"
              defaultValue={
                folders.some((f) => f.id === editing.folderId)
                  ? editing.folderId
                  : folders[0]?.id
              }
              className="field rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-3 text-base text-[var(--text)]"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
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

      {deleting && (
        <Modal
          title="링크 삭제"
          titleId="delete-link-title"
          onClose={() => setDeleting(null)}
        >
          <p className="text-base text-[var(--text)]">
            <strong className="font-bold">{deleting.title}</strong> 링크를
            삭제할까요?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              autoFocus
              onClick={() => setDeleting(null)}
              className="btn-sub rounded-xl px-5 py-2.5 font-semibold text-[var(--text)]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={async () => {
                const removeError = await removeBookmark(deleting.id);
                if (removeError) {
                  showToast("링크를 삭제하지 못했어요", "error");
                  return;
                }
                showToast("링크를 삭제했어요");
                setDeleting(null);
              }}
              className="btn-danger rounded-xl bg-[var(--error)] px-5 py-2.5 font-semibold text-white"
            >
              삭제
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
