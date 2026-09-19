"use client";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center gap-5 px-8 pt-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-hairline bg-surface shadow-card">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path
            d="M2.5 9.2a14 14 0 0119 0M5.6 12.5a9.5 9.5 0 015.3-2.6M8.7 15.8a5 5 0 013.3-1.3M12 19.2h.01M3 3l18 18"
            stroke="#FFB84D"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <h1 className="text-lg font-bold text-ivory">Kamu sedang offline</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Athlete Guardian butuh koneksi internet untuk menampilkan data sensor dan peringatan terbaru
          kamu. Sambungkan kembali perangkat, lalu coba lagi.
        </p>
      </div>
      <button
        onClick={() => window.location.replace("/")}
        className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white active:scale-95"
      >
        Coba lagi
      </button>
    </div>
  );
}
