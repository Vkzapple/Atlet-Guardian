"use client";

import { useEffect, useState } from "react";
import { createAthlete, getAthlete, getAthleteHistory, getAlerts } from "@/lib/api";
import { getMyAthleteId, setMyAthleteId } from "@/lib/myAthlete";
import { Athlete, Reading, AlertItem, Gender, TrainingHistory, InjuryHistory } from "@/lib/types";
import AthleteDashboard from "@/components/AthleteDashboard";
import AddAthleteForm from "@/components/AddAthleteForm";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [history, setHistory] = useState<Reading[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadMyProfile(id: string) {
    try {
      const [{ athlete }, { history }, { alerts }] = await Promise.all([
        getAthlete(id),
        getAthleteHistory(id),
        getAlerts({ athleteId: id, status: "active" }),
      ]);
      setAthlete(athlete);
      setHistory(history);
      setAlerts(alerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat profil kamu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = getMyAthleteId();
    if (id) {
      loadMyProfile(id);
    } else {
      setLoading(false);
    }
  }, []);

  async function handleCreateProfile(payload: {
    name: string;
    sport: string;
    age: number;
    gender: Gender;
    heightCm: number;
    weightKg: number;
    trainingHistory: TrainingHistory;
    injuryHistory: InjuryHistory;
  }) {
    const res = await createAthlete(payload);
    setMyAthleteId(res.athlete.id);
    setAthlete(res.athlete);
    setHistory([]);
    setAlerts([]);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 pt-24 text-center">
        <p className="text-sm text-muted">Memuat…</p>
      </div>
    );
  }

  // Belum ada profil sama sekali -- tampilkan onboarding, bukan roster kosong.
  if (!athlete) {
    return (
      <div className="flex flex-col gap-4 px-5 pt-8">
        <div className="flex flex-col items-center gap-3 pb-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
            <span className="text-2xl">🛡️</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-ivory">Athlete Guardian</h1>
            <p className="mt-1 text-sm text-muted">
              Buat profil kamu untuk mulai memantau kondisi fisik secara real-time
              dari wearable device.
            </p>
          </div>
        </div>
        {error && <p className="text-center text-sm text-critical">{error}</p>}
        <AddAthleteForm onSubmit={handleCreateProfile} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AthleteDashboard initialAthlete={athlete} initialHistory={history} initialAlerts={alerts} />
    </div>
  );
}
