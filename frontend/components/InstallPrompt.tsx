 "use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIosSafari() {
  const ua = navigator.userAgent;
  const isIos =
    /iphone|ipad|ipod/i.test(ua) ||
    (ua.includes("Mac") && "ontouchend" in document);
  const isSafari =
    /safari/i.test(ua) && !/crios|fxios|edgios|chrome|android/i.test(ua);
  return isIos && isSafari;
}

/**
 * Tombol install PWA yang selalu tersedia di posisi fixed.
 * Jika browser mendukung beforeinstallprompt, tombol langsung membuka prompt native.
 * Pada iOS Safari, tombol menampilkan petunjuk "Tambah ke Layar Utama".
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    setIos(isIosSafari());

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setShowHint(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (ios) {
      setShowHint(true);
      return;
    }

    if (!deferred) {
      setShowHint(true);
      return;
    }

    await deferred.prompt();
    const { outcome } = await deferred.userChoice;

    if (outcome === "accepted") {
      setInstalled(true);
      setShowHint(false);
    }

    setDeferred(null);
  }

  if (installed) return null;

  return (
    <>
      {/* Tombol install permanen, ditempatkan tepat di atas bottom navigation. */}
      <div className="fixed inset-x-0 bottom-[calc(4.8rem+env(safe-area-inset-bottom))] z-[55] pointer-events-none mx-auto max-w-md px-5">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={install}
            aria-label="Pasang Athlete Guardian"
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-brand/40 bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-transform active:scale-95"
          >
            <InstallIcon />
            <span>Pasang App</span>
          </button>
        </div>
      </div>

      {/* Petunjuk fallback untuk browser yang tidak menyediakan prompt native dan iOS Safari. */}
      {showHint && (
        <div className="fixed inset-x-0 bottom-[calc(8.8rem+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-md px-5">
          <div className="rounded-2xl border border-hairline bg-surface-raised/98 p-4 shadow-card backdrop-blur">
            <div className="flex items-start gap-3">
              <img
                src="/icons/icon-192.png"
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ivory">
                  Pasang Athlete Guardian
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {ios
                    ? "Ketuk tombol Bagikan di browser, lalu pilih Tambah ke Layar Utama."
                    : "Gunakan menu browser lalu pilih Install app atau Tambahkan ke layar utama."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHint(false)}
                aria-label="Tutup petunjuk"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted active:bg-hairline"
              >
                <CloseIcon />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InstallIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
