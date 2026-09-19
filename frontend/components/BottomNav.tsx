"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Dasbor", icon: HomeIcon },
  { href: "/athletes", label: "Profil", icon: UsersIcon },
  { href: "/alerts", label: "Peringatan", icon: BellIcon }
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t border-hairline bg-surface/95 backdrop-blur">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-colors active:bg-surface-raised"
            >
              {active && (
                <span className="absolute -top-2 h-0.5 w-8 rounded-full bg-brand" aria-hidden="true" />
              )}
              <Icon active={active} />
              <span className={`text-[11px] font-medium ${active ? "text-ivory" : "text-muted"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 11.5L12 4l8 7.5M6 10v9a1 1 0 001 1h3v-6h4v6h3a1 1 0 001-1v-9"
        stroke={active ? "#4C8DFF" : "#7C8AA8"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke={active ? "#4C8DFF" : "#7C8AA8"} strokeWidth="1.8" />
      <path
        d="M3.5 19c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5"
        stroke={active ? "#4C8DFF" : "#7C8AA8"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M15.5 5.2c1.3.4 2.2 1.6 2.2 2.9 0 1.4-.9 2.5-2.1 2.9M17.5 14.2c1.8.5 3 1.9 3 3.8"
        stroke={active ? "#4C8DFF" : "#7C8AA8"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 10c0-3.3 2.7-6 6-6s6 2.7 6 6v3.5l1.5 3H4.5l1.5-3V10z"
        stroke={active ? "#4C8DFF" : "#7C8AA8"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 19a2 2 0 004 0"
        stroke={active ? "#4C8DFF" : "#7C8AA8"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
