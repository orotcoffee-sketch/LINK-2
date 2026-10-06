import type { Metadata } from "next";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import NewLinkForm from "../components/NewLinkForm";

export const metadata: Metadata = {
  title: "링크 추가",
  description: "새 링크를 추가합니다.",
  robots: { index: false },
};

export default function NewLinkPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar />
        <NewLinkForm />
      </div>
    </div>
  );
}
