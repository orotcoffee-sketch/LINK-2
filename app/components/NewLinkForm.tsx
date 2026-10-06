"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Bookmark, Folder } from "../data/types";
import {
  getSelectedFolderId,
  getEffectiveBookmarks,
  getVisibleFolders,
  saveBookmark,
  subscribeFolders,
  validateUrl,
} from "../data/storage";
import { showToast } from "../data/toast";
import { useRouter } from "next/navigation";
import { isAdmin } from "../data/auth";
import { useAuth } from "./AuthControls";
import LinkCard from "./LinkCard";

export default function NewLinkForm() {
  const router = useRouter();
  const auth = useAuth();
  const admin = isAdmin(auth);
  // 관리자가 아니면 이 화면에 머물 수 없다. (표시용 가드, 실제 쓰기는 DB RLS가 막는다)
  useEffect(() => {
    if (auth.ready && !admin) router.replace(auth.signedIn ? "/" : "/login");
  }, [auth.ready, auth.signedIn, admin, router]);
  const [saved, setSaved] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  // "" = 아직 선택하지 않음 (All 화면에서 진입한 경우)
  const [folderId, setFolderId] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [folderError, setFolderError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setFolders(getVisibleFolders());
      setSaved(getEffectiveBookmarks());
    };
    sync();
    const current = getSelectedFolderId();
    setFolderId(current === "all" ? "" : current);
    return subscribeFolders(sync);
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const url = new FormData(form).get("url");
    if (typeof url !== "string") return;

    const error = validateUrl(url);
    setUrlError(error);
    const folderMissing = !folders.some((f) => f.id === folderId);
    setFolderError(folderMissing ? "저장할 폴더를 선택해주세요." : null);
    if (error || folderMissing) return;

    const saveError = await saveBookmark(url.trim(), folderId);
    if (saveError) {
      showToast("링크를 저장하지 못했어요", "error");
      return;
    }
    showToast("링크를 저장했어요");
    form.reset();
  }

  const folderName = (id: string) =>
    folders.find((f) => f.id === id)?.name ?? "미분류";

  if (!admin) return <main className="flex-1 p-5" />;

  return (
    <main className="flex-1 p-5 md:p-8">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="card flex max-w-xl flex-col gap-4 rounded-[20px] p-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <input
              type="url"
              name="url"
              aria-label="링크 주소"
              aria-invalid={urlError ? true : undefined}
              aria-describedby={urlError ? "new-url-error" : undefined}
              onChange={() => setUrlError(null)}
              placeholder="https://example.com"
              className={`field rounded-xl border bg-[var(--card)] px-3.5 py-3 text-base text-[var(--text)] ${
                urlError ? "border-[var(--error)]" : "border-[var(--border)]"
              }`}
            />
            {urlError && (
              <p
                id="new-url-error"
                role="alert"
                className="text-[13px] leading-[1.4] text-[var(--error)]"
              >
                {urlError}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5 sm:w-44">
            <select
              name="folderId"
              aria-label="저장할 폴더"
              aria-invalid={folderError ? true : undefined}
              aria-describedby={folderError ? "new-folder-error" : undefined}
              value={folderId}
              onChange={(e) => {
                setFolderId(e.target.value);
                setFolderError(null);
              }}
              className={`field rounded-xl border bg-[var(--card)] px-3.5 py-3 text-base text-[var(--text)] ${
                folderError ? "border-[var(--error)]" : "border-[var(--border)]"
              }`}
            >
              <option value="" disabled>
                폴더 선택
              </option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            {folderError && (
              <p
                id="new-folder-error"
                role="alert"
                className="text-[13px] leading-[1.4] text-[var(--error)]"
              >
                {folderError}
              </p>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="btn self-end rounded-xl bg-[var(--accent)] px-6 py-3 text-base font-semibold text-white"
        >
          저장
        </button>
      </form>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {saved.map((b) => (
          <LinkCard
            key={b.id}
            bookmark={b}
            folderName={folderName(b.folderId)}
          />
        ))}
      </div>
    </main>
  );
}
