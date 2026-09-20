"use client";

import { useEffect, useState } from "react";
import { Reading } from "@/lib/types";

interface SessionTrackerProps {
  athleteId: string;
  history: Reading[];
}

interface SessionSummary {
  durationMin: number;
  avgHr: number;
  maxHr: number;
  dataPoints: number;
}

function storageKey(athleteId: string) {
  return `athlete-guardian-session-${athleteId}`;
}

function formatElapsed(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

// Konsep sesi latihan MURNI di frontend: tidak perlu kolom/tabel baru di
// database. Sesi cuma menandai rentang waktu (startedAt -> berhenti), lalu
// ringkasannya dihitung dari `history` (readings) yang timestamp-nya jatuh
// di rentang itu. Kalau nanti mau simpan histori sesi permanen ke Supabase,
// tinggal POST rentang waktu + summary ke endpoint baru saat sesi selesai.
export default function SessionTracker({ athleteId, history }: SessionTrackerProps) {
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey(athleteId));
    if (saved) setStartedAt(saved);
  }, [athleteId]);

  useEffect(() => {
    if (!startedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  function handleStart() {
    const ts = new Date().toISOString();
    setStartedAt(ts);
    setSummary(null);
    localStorage.setItem(storageKey(athleteId), ts);
  }

  function handleStop() {
    if (!startedAt) return;
    const sessionReadings = history.filter((r) => r.timestamp >= startedAt);
    const durationMin = Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / 60000));

    if (sessionReadings.length > 0) {
      const hrValues = sessionReadings.map((r) => r.hrCurrent);
      setSummary({
        durationMin,
        avgHr: Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length),
        maxHr: Math.max(...hrValues),
        dataPoints: sessionReadings.length
      });
    } else {
      setSummary({ durationMin, avgHr: 0, maxHr: 0, dataPoints: 0 });
    }

    setStartedAt(null);
    localStorage.removeItem(storageKey(athleteId));
  }

  if (summary) {
    return (
      <div className="rounded-2xl border border-optimal/30 bg-optimal/10 p-4">
        <p className="text-xs font-semibold text-optimal">Sesi selesai</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="font-mono text-lg font-semibold text-ivory">{summary.durationMin}</p>
            <p className="text-[10px] text-muted">menit</p>
          </div>
          <div>
            <p className="font-mono text-lg font-semibold text-ivory">{summary.avgHr || "–"}</p>
            <p className="text-[10px] text-muted">rata² bpm</p>
          </div>
          <div>
            <p className="font-mono text-lg font-semibold text-ivory">{summary.maxHr || "–"}</p>
            <p className="text-[10px] text-muted">maks bpm</p>
          </div>
        </div>
        {summary.dataPoints === 0 && (
          <p className="mt-2 text-[11px] text-muted">
            Tidak ada data sensor selama sesi ini -- pastikan wearable terpasang saat latihan.
          </p>
        )}
        <button
          onClick={() => setSummary(null)}
          className="mt-3 w-full rounded-full border border-hairline py-2 text-xs font-medium text-ivory"
        >
          Tutup
        </button>
      </div>
    );
  }

  if (startedAt) {
    const elapsed = now - new Date(startedAt).getTime();
    return (
      <div className="flex items-center justify-between rounded-2xl border border-pulse/30 bg-pulse/10 p-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-pulse" />
            <p className="text-xs font-semibold text-pulse">Sesi berjalan</p>
          </div>
          <p className="mt-1 font-mono text-2xl font-semibold text-ivory">{formatElapsed(elapsed)}</p>
        </div>
        <button
          onClick={handleStop}
          className="rounded-full bg-pulse px-4 py-2.5 text-xs font-bold text-ink"
        >
          Selesai Sesi
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleStart}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-volt py-3.5 text-sm font-bold text-ink"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
      Mulai Sesi Latihan
    </button>
  );
}