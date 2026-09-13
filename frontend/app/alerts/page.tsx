"use client";

import { useEffect, useState } from "react";
import { acknowledgeAlert, getAlerts } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import { AlertItem } from "@/lib/types";
import AlertBanner from "@/components/AlertBanner";

type Tab = "active" | "acknowledged";

const POLL_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS) || 4000;

export default function AlertsPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh(currentTab: Tab) {
    setLoading(true);
    const res = await getAlerts({ status: currentTab });
    setAlerts(res.alerts);
    setLoading(false);
  }

  useEffect(() => {
    refresh(tab);
  }, [tab]);

  usePolling(async () => {
    try {
      const res = await getAlerts({ status: tab });
      setAlerts(res.alerts);
    } catch {
      return;
    }
  }, POLL_INTERVAL_MS);

  async function handleAcknowledge(id: string) {
    await acknowledgeAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-6">
      <h1 className="text-xl font-bold text-ivory">Peringatan</h1>

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
              showAthleteName
              onAcknowledge={tab === "active" ? handleAcknowledge : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
