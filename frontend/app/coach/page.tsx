"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCoachAthletes, acceptCoachConnection, removeCoachConnection } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import { statusColor, statusLabel } from "@/lib/status";
import { Athlete } from "@/lib/types";
import Logo from "@/components/Logo";

interface Connection {
  id: string;
  status: "pending" | "accepted";
  athlete: Athlete;
}

export default function CoachDashboardPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await getCoachAthletes();
      setConnections(res.connections as Connection[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat daftar atlet");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      router.push("/");
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAccept(connectionId: string) {
    await acceptCoachConnection(connectionId);
    refresh();
  }

  async function handleRemove(connectionId: string) {
    const confirmed = window.confirm("Putuskan koneksi dengan atlet ini?");
    if (!confirmed) return;
    await removeCoachConnection(connectionId);
    refresh();
  }

  function handleLogout() {
    clearToken();
    router.push("/");
  }

  const accepted = connections.filter((c) => c.status === "accepted");
  const pending = connections.filter((c) => c.status === "pending");

  if (loading) {
    return (
      <div className="px-5 pt-6">
        <p className="text-sm text-muted">Memuat…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-5 pt-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <h1 className="text-xl font-bold text-ivory">Coach Dashboard</h1>
        </div>
        <button onClick={handleLogout} className="text-xs text-muted underline">
          Keluar
        </button>
      </div>

      {error && <p className="text-sm text-critical">{error}</p>}

      {pending.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-ivory">Undangan menunggu ({pending.length})</p>
          <div className="flex flex-col gap-2">
            {pending.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-2xl border border-hairline bg-surface p-4">
                <div>
                  <p className="text-sm font-semibold text-ivory">{c.athlete.name}</p>
                  <p className="text-xs text-muted">{c.athlete.sport}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRemove(c.id)}
                    className="rounded-full border border-hairline px-3 py-1.5 text-xs font-medium text-muted"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() => handleAccept(c.id)}
                    className="rounded-full bg-volt px-3 py-1.5 text-xs font-bold text-ink"
                  >
                    Terima
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-ivory">
          Atlet saya {accepted.length > 0 && `(${accepted.length})`}
        </p>

        {accepted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hairline bg-surface p-8 text-center">
            <p className="text-sm font-medium text-ivory">Belum ada atlet terhubung</p>
            <p className="mt-1 text-xs text-muted">
              Bagikan email akun coach kamu ke atlet supaya mereka bisa mengundangmu saat mendaftar.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {accepted.map((c) => {
              const reading = c.athlete.latestReading;
              const color = reading ? statusColor[reading.conditionStatus] : "#7C8AA8";
              return (
                <button
                  key={c.id}
                  onClick={() => router.push(`/athletes/${c.athlete.id}`)}
                  className="flex items-center justify-between rounded-2xl border border-hairline bg-surface p-4 text-left transition-colors active:bg-surface-raised"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-surface-raised">
                      {c.athlete.photoUrl ? (
                        <img src={c.athlete.photoUrl} alt={c.athlete.name} className="h-full w-full object-cover" />
                      ) : (
                        <Logo size={22} className="opacity-70" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ivory">{c.athlete.name}</p>
                      <p className="text-xs text-muted">{c.athlete.sport}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {reading ? (
                      <>
                        <p className="font-mono text-lg font-semibold text-ivory">
                          {Math.round(reading.fatigueScore)}
                        </p>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: `${color}1F`, color }}
                        >
                          {statusLabel[reading.conditionStatus]}
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] text-muted">Belum ada data</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}