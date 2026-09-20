"use client";

import { useEffect, useState } from "react";
import { getAthlete, getAthleteHistory } from "@/lib/api";
import { Athlete, Reading } from "@/lib/types";
import { statusColor, statusLabel, genderLabel, trainingHistoryLabel } from "@/lib/status";

// Halaman ini didesain print-friendly (bukan cuma untuk dilihat di layar).
// Klik "Unduh / Cetak" -> window.print() -> pilih "Save as PDF" di dialog
// print browser. Tidak perlu library PDF tambahan.
export default function ReportPage({ params }: { params: { id: string } }) {
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [history, setHistory] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAthlete(params.id), getAthleteHistory(params.id, 100)])
      .then(([athleteRes, historyRes]) => {
        setAthlete(athleteRes.athlete);
        setHistory(historyRes.history);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="px-5 pt-6">
        <p className="text-sm text-muted">Menyusun laporan…</p>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="px-5 pt-6">
        <p className="text-sm text-muted">Atlet tidak ditemukan.</p>
      </div>
    );
  }

  const hrValues = history.map((r) => r.hrCurrent).filter((v) => v > 0);
  const avgHr = hrValues.length ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : 0;
  const maxHr = hrValues.length ? Math.max(...hrValues) : 0;
  const avgFatigue = history.length
    ? Math.round(history.reduce((a, b) => a + b.fatigueScore, 0) / history.length)
    : 0;
  const warningCount = history.filter((r) => r.earlyWarning).length;

  return (
    <div className="flex flex-col gap-5 px-5 pt-6 pb-10 print:px-0">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-bold text-ivory">Laporan Performa</h1>
        <button
          onClick={() => window.print()}
          className="rounded-full bg-volt px-4 py-2 text-xs font-bold text-ink"
        >
          Unduh / Cetak
        </button>
      </div>

      <div className="rounded-2xl border border-hairline bg-surface p-4">
        <p className="text-xs text-muted">Laporan untuk</p>
        <p className="text-lg font-bold text-ivory">{athlete.name}</p>
        <p className="text-xs text-muted">
          {athlete.sport} · {genderLabel[athlete.gender]} · {athlete.age} tahun ·{" "}
          {trainingHistoryLabel[athlete.trainingHistory]}
        </p>
        <p className="mt-2 text-[11px] text-muted">
          Dicetak pada {new Date().toLocaleString("id-ID")} · Berdasarkan {history.length} data sensor terakhir
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-hairline bg-surface p-4">
          <p className="font-mono text-2xl font-semibold text-ivory">{avgHr || "–"}</p>
          <p className="text-[11px] text-muted">Rata-rata HR (bpm)</p>
        </div>
        <div className="rounded-2xl border border-hairline bg-surface p-4">
          <p className="font-mono text-2xl font-semibold text-ivory">{maxHr || "–"}</p>
          <p className="text-[11px] text-muted">HR Maksimal (bpm)</p>
        </div>
        <div className="rounded-2xl border border-hairline bg-surface p-4">
          <p className="font-mono text-2xl font-semibold text-ivory">{avgFatigue}</p>
          <p className="text-[11px] text-muted">Rata-rata skor kelelahan</p>
        </div>
        <div className="rounded-2xl border border-hairline bg-surface p-4">
          <p className="font-mono text-2xl font-semibold text-critical">{warningCount}</p>
          <p className="text-[11px] text-muted">Total peringatan dini</p>
        </div>
      </div>

      <div className="rounded-2xl border border-hairline bg-surface p-4">
        <p className="text-sm font-medium text-ivory">Baseline atlet</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted">
          <span>HR Istirahat: {athlete.baseline.restingHR} bpm</span>
          <span>HR Maksimal: {Math.round(athlete.baseline.maxHR)} bpm</span>
          <span>Tinggi: {athlete.heightCm} cm</span>
          <span>Berat: {athlete.weightKg} kg</span>
        </div>
      </div>

      <div className="rounded-2xl border border-hairline bg-surface">
        <p className="border-b border-hairline px-4 py-3 text-sm font-medium text-ivory">
          Detail 20 pembacaan terakhir
        </p>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-hairline text-left text-muted">
              <th className="px-4 py-2 font-medium">Waktu</th>
              <th className="px-4 py-2 font-medium">HR</th>
              <th className="px-4 py-2 font-medium">Skor</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {[...history]
              .reverse()
              .slice(0, 20)
              .map((r) => (
                <tr key={r.id} className="border-b border-hairline/60 last:border-b-0">
                  <td className="px-4 py-2 text-muted">{new Date(r.timestamp).toLocaleString("id-ID")}</td>
                  <td className="px-4 py-2 text-ivory">{r.hrCurrent} bpm</td>
                  <td className="px-4 py-2 text-ivory">{Math.round(r.fatigueScore)}</td>
                  <td className="px-4 py-2" style={{ color: statusColor[r.conditionStatus] }}>
                    {statusLabel[r.conditionStatus]}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}