"use client";

import { useEffect, useState } from "react";
import { acknowledgeAlert, getAlerts } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { getMyAthleteId } from "@/lib/myAthlete";
import { AlertItem } from "@/lib/types";
import AlertBanner from "@/components/AlertBanner";

type Tab = "active" | "acknowledged";

const POLL_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS) || 4000;

export default function AlertsPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const athleteId = getMyAthleteId();

  async function refresh(currentTab: Tab) {
    if (!athleteId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await getAlerts({ athleteId, status: currentTab });
    setAlerts(res.alerts);
    setLoading(false);
  }

  useEffect(() => {
    refresh(tab);
  }, [tab]);

  usePolling(async () => {
    if (!athleteId) return;
    try {
      const res = await getAlerts({ athleteId, status: tab });
      setAlerts(res.alerts);
    } catch {
      return;
    }
  }, POLL_INTERVAL_MS);

  async function handleAcknowledge(id: string) {
    await acknowledgeAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  if (!athleteId) {
    return (
      <div className="px-5 pt-8 text-center">
        <p className="text-sm text-muted">Buat profil kamu dulu di Dasbor untuk melihat peringatan.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-6 pb-8">
      <h1 className="text-xl font-bold text-ivory">Peringatan Kamu</h1>

      <div className="flex gap-1.5 rounded-full border border-hairline bg-surface p-1">
        {(["active", "acknowledged"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-2 text-xs font-semibold transition-colors ${
              tab === t ? "bg-volt text-ink" : "text-muted"
            }`}
          >
            {t === "active" ? "Aktif" : "Selesai"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline bg-surface p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-optimal/10">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="#2FE6A3"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="mt-3 text-sm font-medium text-ivory">
            {tab === "active" ? "Tidak ada peringatan aktif" : "Belum ada riwayat peringatan"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {tab === "active"
              ? "Kondisi fisik kamu terpantau normal saat ini."
              : "Peringatan yang sudah kamu tandai selesai akan muncul di sini."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {alerts.map((alert) => (
            <AlertBanner
              key={alert.id}
              alert={alert}
              onAcknowledge={tab === "active" ? handleAcknowledge : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}