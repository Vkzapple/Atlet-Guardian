"use client";

import { useEffect, useState } from "react";

/**
 * Menampilkan strip tipis saat perangkat kehilangan koneksi.
 * Hanya membaca status jaringan browser (online/offline event) -- tidak melakukan request apa pun.
 */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 border-b border-caution/30 bg-caution/15 px-4 py-1.5"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-caution" />
      <span className="text-[11px] font-medium text-caution">
        Kamu sedang offline · data tidak diperbarui
      </span>
    </div>
  );
}
