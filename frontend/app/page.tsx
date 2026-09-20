"use client";

import { useEffect, useState } from "react";
import { login, register, getMe, getAthleteHistory, getAlerts } from "@/lib/api";
import { setMyAthleteId } from "@/lib/myAthlete";
import { getToken, setToken, clearToken } from "@/lib/auth";
import { Athlete, Reading, AlertItem, Gender, TrainingHistory, InjuryHistory } from "@/lib/types";
import AthleteDashboard from "@/components/AthleteDashboard";
import AddAthleteForm from "@/components/AddAthleteForm";
import LoginForm from "@/components/LoginForm";
import Logo from "@/components/Logo";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [history, setHistory] = useState<Reading[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  async function loadDashboardData(id: string) {
    try {
      const [{ history }, { alerts }] = await Promise.all([
        getAthleteHistory(id),
        getAlerts({ athleteId: id, status: "active" })
      ]);
      setHistory(history);
      setAlerts(alerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data kamu");
    }
  }

  useEffect(() => {
    async function restoreSession() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Validasi token ke backend sekaligus ambil profil terbaru.
        // Kalau token sudah kedaluwarsa/invalid, ini akan melempar error.
        const { athlete } = await getMe();
        setMyAthleteId(athlete.id);
        setAthlete(athlete);
        await loadDashboardData(athlete.id);
      } catch (err) {
        // Token tidak valid lagi -> anggap sesi habis, kembali ke layar login.
        clearToken();
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(payload: { email: string; password: string }) {
    const res = await login(payload);
    setToken(res.token);
    setMyAthleteId(res.athlete.id);
    setAthlete(res.athlete);
    await loadDashboardData(res.athlete.id);
  }

  async function handleRegister(payload: {
    email: string;
    password: string;
    name: string;
    sport: string;
    age: number;
    gender: Gender;
    heightCm: number;
    weightKg: number;
    trainingHistory: TrainingHistory;
    injuryHistory: InjuryHistory;
  }) {
    const res = await register(payload);
    setToken(res.token);
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

  // Belum login sama sekali -- tampilkan form login/register, bukan dashboard.
  if (!athlete) {
    return (
      <div className="flex flex-col gap-4 px-5 pt-8">

<div className="flex flex-col items-center gap-3 pb-2 text-center">
  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
    <Logo size={40} />
  </div>
  <div>
    <h1 className="text-lg font-bold text-ivory">Athlete Guardian</h1>
    <p className="mt-1 text-sm text-muted">
      {authMode === "login"
        ? "Masuk untuk memantau kondisi fisik kamu secara real-time."
        : "Buat akun untuk mulai memantau kondisi fisik secara real-time dari wearable device."}
    </p>
  </div>
</div>
        {error && <p className="text-center text-sm text-critical">{error}</p>}
        {authMode === "login" ? (
          <LoginForm onSubmit={handleLogin} onSwitchToRegister={() => setAuthMode("register")} />
        ) : (
          <AddAthleteForm onSubmit={handleRegister} onSwitchToLogin={() => setAuthMode("login")} />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AthleteDashboard initialAthlete={athlete} initialHistory={history} initialAlerts={alerts} />
    </div>
  );
}
