import Logo from "./Logo";
import AuthControls from "./AuthControls";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--glass)] px-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-md md:px-8">
      <Logo />
      <AuthControls />
    </header>
  );
}
