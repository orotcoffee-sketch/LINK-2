"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { Bookmark } from "../data/types";
import { showToast } from "../data/toast";

function Icon({ children }: { children: ReactNode }) {
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
      {children}
    </svg>
  );
}

const actionBase =
  "card-action flex h-8 w-8 items-center justify-center rounded-lg";
const actionClass = `${actionBase} text-[var(--text-sub)]`;
const dangerClass = `${actionBase} card-action-danger text-[var(--error)]`;

type Props = {
  bookmark: Bookmark;
  folderName: string;
  onCopy?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

const norm = (v: string) => v.trim().replace(/\/+$/, "").toLowerCase();

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function faviconOf(url: string): string {
  try {
    return new URL("/favicon.ico", url).toString();
  } catch {
    return "";
  }
}

export default function LinkCard({
  bookmark,
  folderName,
  onCopy,
  onEdit,
  onDelete,
}: Props) {
  const hasActions = onCopy || onEdit || onDelete;
  // 이미지 → favicon → 첫 글자 순으로 단계 하락한다. 실패한 URL만 기억해 URL이 바뀌면 다시 시도한다.
  const [failedThumb, setFailedThumb] = useState("");
  const [failedFavicon, setFailedFavicon] = useState("");
  const host = hostOf(bookmark.url);
  const favicon = faviconOf(bookmark.url);
  const hasThumb = bookmark.thumbnailUrl !== "" && failedThumb !== bookmark.thumbnailUrl;
  const showFavicon = favicon !== "" && failedFavicon !== favicon;
  const description = bookmark.description.trim();
  const showDescription =
    description !== "" &&
    norm(description) !== norm(bookmark.url) &&
    norm(description) !== norm(bookmark.title);

  // 공유: Web Share API가 있으면 공유창, 없으면 URL 복사로 대체한다.
  async function handleShare() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: bookmark.title, url: bookmark.url });
      } catch (e) {
        // 사용자가 공유창을 닫은 경우는 오류가 아니다.
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          showToast("공유하지 못했어요", "error");
        }
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(bookmark.url);
      showToast("공유를 지원하지 않아 URL을 복사했어요");
    } catch {
      showToast("복사하지 못했어요", "error");
    }
  }
  return (
    <div className="link-card card card-hover relative flex w-full rounded-[20px]">
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full flex-col overflow-hidden rounded-[20px]"
      >
        {hasThumb && (
          <div className="card-thumb aspect-video w-full overflow-hidden border-b border-[var(--border)] bg-[var(--soft)]">
            {/* 북마크 도메인이 제각각이라 next/image 대신 일반 img를 쓴다. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bookmark.thumbnailUrl}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setFailedThumb(bookmark.thumbnailUrl)}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
          <div className={`flex items-start gap-4 ${hasActions && !hasThumb ? "pr-[4.5rem]" : ""}`}>
            {!hasThumb && (
              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--soft)] text-xl font-semibold uppercase text-[var(--text-sub)]"
              >
                {showFavicon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={favicon}
                    alt=""
                    width={28}
                    height={28}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() => setFailedFavicon(favicon)}
                    className="h-7 w-7 object-contain"
                  />
                ) : (
                  host.charAt(0)
                )}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[var(--text)]">
                {bookmark.title}
              </h3>
              <p className="mt-0.5 truncate text-[13px] text-[var(--placeholder)]">{bookmark.url}</p>
            </div>
          </div>
          {showDescription && (
            <p className="line-clamp-3 text-sm leading-relaxed text-[var(--text-sub)]">
              {description}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between gap-2">
            <span className="max-w-[70%] truncate rounded-lg bg-[var(--hover-bg)] px-2.5 py-1 text-[13px] font-medium leading-[1.4] text-[var(--text-sub)]">
              {folderName}
            </span>
            <time
              dateTime={bookmark.createdAt}
              className="shrink-0 text-[13px] leading-[1.4] text-[var(--placeholder)]"
            >
              {bookmark.createdAt.replace(/-/g, ".")}
            </time>
          </div>
        </div>
      </a>
      {hasActions && (
        <div className="absolute right-3 top-3 grid grid-cols-2 gap-1 rounded-full bg-[var(--glass)] p-0.5 backdrop-blur-sm">
          <button
            type="button"
            data-no-drag
            aria-label={`${bookmark.title} 공유`}
            onClick={handleShare}
            className={actionClass}
          >
            <Icon>
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
            </Icon>
          </button>
          {onCopy && (
            <button
              type="button"
              data-no-drag
              aria-label={`${bookmark.title} URL 복사`}
              onClick={onCopy}
              className={actionClass}
            >
              <Icon>
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15V6a2 2 0 0 1 2-2h9" />
              </Icon>
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              data-no-drag
              aria-label={`${bookmark.title} 수정`}
              onClick={onEdit}
              className={actionClass}
            >
              <Icon>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </Icon>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              data-no-drag
              aria-label={`${bookmark.title} 삭제`}
              onClick={onDelete}
              className={dangerClass}
            >
              <Icon>
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
              </Icon>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
