"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "athlete-guardian-install-dismissed";
const DISMISS_DAYS = 7;
const SHOW_DELAY_MS = 4000;

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIosSafari() {
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|chrome|android/i.test(ua);
  return isIos && isSafari;
}

function recentlyDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Mengajak pengguna memasang app ke layar utama.
 * Murni UI + event browser; tidak ada fetching data.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    if (isIosSafari()) {
      setShowIosHint(true);
      timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* abaikan */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") setVisible(false);
    else dismiss();
  }

  if (!visible || (!deferred && !showIosHint)) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-md px-4">
      <div className="flex items-start gap-3 rounded-2xl border border-hairline bg-surface-raised/95 p-3.5 shadow-card backdrop-blur">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ivory">Pasang Athlete Guardian</p>
          {deferred ? (
            <p className="mt-0.5 text-xs leading-snug text-muted">
              Buka langsung dari layar utama, tampil layar penuh seperti app biasa.
            </p>
          ) : (
            <p className="mt-0.5 text-xs leading-snug text-muted">
              Ketuk tombol <span className="font-semibold text-ivory">Bagikan</span>, lalu pilih{" "}
              <span className="font-semibold text-ivory">Tambah ke Layar Utama</span>.
            </p>
          )}
          <div className="mt-2.5 flex items-center gap-2">
            {deferred && (
              <button
                onClick={install}
                className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white active:scale-95"
              >
                Pasang
              </button>
            )}
            <button onClick={dismiss} className="px-2 py-1.5 text-xs font-medium text-muted active:opacity-70">
              Nanti saja
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Tutup"
          className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted active:bg-hairline"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
