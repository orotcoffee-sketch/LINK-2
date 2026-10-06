import Link from "next/link";

export default function AddLinkButton() {
  return (
    <Link
      href="/new"
      className="btn inline-flex h-9 items-center rounded-xl bg-[var(--accent)] px-3.5 text-sm font-medium text-white"
    >
      + 링크 추가
    </Link>
  );
}
