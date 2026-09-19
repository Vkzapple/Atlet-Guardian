"use client";

import { useEffect, useState } from "react";

/**
 * Mendaftarkan service worker (hanya di production) dan menampilkan toast
 * "Versi baru tersedia" saat ada deploy baru.
 * Komponen ini tidak melakukan fetching data apa pun.
 */
export default function PWARegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Di development, SW bisa membuat HMR/cache membingungkan -> pastikan tidak aktif.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => undefined);
      return;
    }

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);

        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              setWaiting(installing);
            }
          });
        });

        // Cek pembaruan tiap kali app dibuka kembali dari background.
        const checkUpdate = () => {
          if (document.visibilityState === "visible") reg.update().catch(() => undefined);
        };
        document.addEventListener("visibilitychange", checkUpdate);
      })
      .catch(() => undefined);

    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  if (!waiting) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[70] mx-auto max-w-md px-4"
    >
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand/40 bg-surface-raised/95 px-4 py-3 shadow-card backdrop-blur">
        <p className="text-xs font-medium text-ivory">Versi baru tersedia</p>
        <button
          onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })}
          className="rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white active:scale-95"
        >
          Perbarui
        </button>
      </div>
    </div>
  );
}
