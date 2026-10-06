import SidebarItem from "./SidebarItem";
import FolderList from "./FolderList";

export default function Sidebar() {
  return (
    <nav
      aria-label="폴더"
      className="flex w-full shrink-0 flex-col gap-4 px-5 pt-4 md:w-60 md:gap-6 md:border-r md:border-[var(--border)] md:bg-[var(--soft)] md:p-6"
    >
      <SidebarItem label="All" folderId="all" />
      <div>
        <h2 className="mb-2 px-3 text-[13px] font-semibold uppercase leading-[1.4] text-[var(--text-sub)]">
          Folders
        </h2>
        <FolderList />
      </div>
    </nav>
  );
}
