"use client";

import ThemeToggle from "./ThemeToggle";
import OfflineBanner from "./OfflineBanner";
import Logo from "./Logo";


export default function AppHeader() {
  return (
    <header className="safe-top sticky top-0 z-40 border-b border-hairline/70 bg-ink/85 backdrop-blur-md">
      <div className="flex h-12 items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <span className="text-sm font-bold tracking-tight text-ivory">Athlete Guardian</span>
        </div>
        <ThemeToggle />
      </div>
      <OfflineBanner />
    </header>
  );
}