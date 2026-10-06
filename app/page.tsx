import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import LinkGrid from "./components/LinkGrid";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar />
        <LinkGrid />
      </div>
    </div>
  );
}
