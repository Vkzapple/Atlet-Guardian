"use client";

import { useEffect, useState } from "react";

const THEME_COLOR = { dark: "#0A0F1A", light: "#F6F7FA" };

function syncThemeColor(isLight: boolean) {
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute("content", isLight ? THEME_COLOR.light : THEME_COLOR.dark));
}

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const light = document.documentElement.classList.contains("light");
    setIsLight(light);
    syncThemeColor(light);
  }, []);

  function toggleTheme() {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("athlete-guardian-theme", next ? "light" : "dark");
    syncThemeColor(next);
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={isLight ? "Aktifkan mode malam" : "Aktifkan mode terang"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface/90 transition-transform active:scale-95"
    >
      {isLight ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.5" stroke="#FFB84D" strokeWidth="1.8" />
      <path
        d="M12 2.5v2.5M12 19v2.5M4.4 4.4l1.8 1.8M17.8 17.8l1.8 1.8M2.5 12H5M19 12h2.5M4.4 19.6l1.8-1.8M17.8 6.2l1.8-1.8"
        stroke="#FFB84D"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 14.2A8.5 8.5 0 119.8 4a7 7 0 0010.2 10.2z"
        stroke="#4C8DFF"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
