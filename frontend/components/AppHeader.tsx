"use client";

import ThemeToggle from "./ThemeToggle";
import OfflineBanner from "./OfflineBanner";

/**
 * Top app bar ala app native: sticky, blur, menghormati notch / status bar (safe-area).
 * Menggantikan ThemeToggle yang sebelumnya `fixed` dan menimpa konten header dasbor.
 */
export default function AppHeader() {
  return (
    <header className="safe-top sticky top-0 z-40 border-b border-hairline/70 bg-ink/85 backdrop-blur-md">
      <div className="flex h-12 items-center justify-between px-5">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" width={24} height={24} className="h-6 w-6 rounded-md" />
          <span className="text-sm font-bold tracking-tight text-ivory">Athlete Guardian</span>
        </div>
        <ThemeToggle />
      </div>
      <OfflineBanner />
    </header>
  );
}
