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
      <div className="px-5 pt-6">
        <p className="text-sm text-muted">Buat profil kamu dulu di Dasbor untuk melihat peringatan.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-6">
      <h1 className="text-xl font-bold text-ivory">Peringatan Kamu</h1>

      <div className="flex gap-2 rounded-full bg-surface p-1">
        {(["active", "acknowledged"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-2 text-xs font-semibold transition-colors ${
              tab === t ? "bg-brand text-ivory" : "text-muted"
            }`}
          >
            {t === "active" ? "Aktif" : "Selesai"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Memuat…</p>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-muted">
          {tab === "active" ? "Tidak ada peringatan aktif saat ini." : "Belum ada riwayat peringatan."}
        </p>
      ) : (
        <div className="flex flex-col gap-2 pb-6">
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
