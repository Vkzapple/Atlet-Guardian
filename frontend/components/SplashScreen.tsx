"use client";

import { useEffect, useState } from "react";
import Logo from "./Logo";

const SESSION_KEY = "athlete-guardian-splash-shown";
const MIN_VISIBLE_MS = 1100;

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    if (alreadyShown) return;

    setVisible(true);
    sessionStorage.setItem(SESSION_KEY, "1");

    const timer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => setVisible(false), 400);
    }, MIN_VISIBLE_MS);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink transition-opacity duration-400 ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-volt/20" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-volt/30 bg-surface shadow-card">
          <Logo size={56} />
        </div>
      </div>
      <p className="mt-5 text-lg font-extrabold tracking-tight text-ivory">Athlete Guardian</p>
      <div className="mt-6 h-1 w-24 overflow-hidden rounded-full bg-surface">
        <div className="h-full w-1/2 animate-[splash-bar_1.1s_ease-in-out_infinite] rounded-full bg-volt" />
      </div>
    </div>
  );
}