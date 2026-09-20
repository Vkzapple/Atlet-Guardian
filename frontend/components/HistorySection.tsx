"use client";

import { useEffect, useState } from "react";
import { getAthleteHistory } from "@/lib/api";
import { Reading } from "@/lib/types";
import { statusColor, formatRelativeTime } from "@/lib/status";
import Sparkline from "./Sparkline";

interface HistorySectionProps {
  athleteId: string;
}

export default function HistorySection({ athleteId }: HistorySectionProps) {
  const [history, setHistory] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAthleteHistory(athleteId, 100)
      .then((res) => setHistory(res.history))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [athleteId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-hairline bg-surface p-4">
        <p className="text-sm text-muted">Memuat riwayat…</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline bg-surface p-6 text-center">
        <p className="text-sm text-muted">Belum ada riwayat data sensor.</p>
      </div>
    );
  }

  const hrTrend = history.map((r) => r.hrCurrent);
  const recentFirst = [...history].reverse();

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-hairline bg-surface p-4">
        <p className="text-xs font-medium text-muted">Tren Detak Jantung ({history.length} data terakhir)</p>
        <div className="mt-2">
          <Sparkline values={hrTrend} color="#FF4D6D" filled />
        </div>
      </div>

      <div className="rounded-2xl border border-hairline bg-surface">
        <p className="border-b border-hairline px-4 py-3 text-sm font-medium text-ivory">Riwayat pembacaan</p>
        <div className="max-h-80 overflow-y-auto">
          {recentFirst.map((reading) => (
            <div
              key={reading.id}
              className="flex items-center justify-between border-b border-hairline/60 px-4 py-3 last:border-b-0"
            >
              <div>
                <p className="text-sm font-medium text-ivory">
                  {reading.hrCurrent} <span className="text-xs text-muted">bpm</span>
                </p>
                <p className="text-[11px] text-muted">{formatRelativeTime(reading.timestamp)}</p>
              </div>
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  backgroundColor: `${statusColor[reading.conditionStatus]}1F`,
                  color: statusColor[reading.conditionStatus]
                }}
              >
                Skor {Math.round(reading.fatigueScore)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}