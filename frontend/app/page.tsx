"use client";

import { useEffect, useState } from "react";
import { login, register, getMe, getAthleteHistory, getAlerts } from "@/lib/api";
import { setMyAthleteId } from "@/lib/myAthlete";
import { getToken, setToken, clearToken } from "@/lib/auth";
import { Athlete, Reading, AlertItem } from "@/lib/types";
import AthleteDashboard from "@/components/AthleteDashboard";
import OnboardingFlow from "@/components/OnboardingFlow";
import { RegisterPayload } from "@/components/RegisterForm";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [history, setHistory] = useState<Reading[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);

  async function loadDashboardData(id: string) {
    try {
      const [{ history }, { alerts }] = await Promise.all([
        getAthleteHistory(id),
        getAlerts({ athleteId: id, status: "active" })
      ]);
      setHistory(history);
      setAlerts(alerts);
    } catch {
      return;
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
        const res = await getMe();
        setRole(res.role);
        setLoggedIn(true);
        if (res.athlete) {
          setMyAthleteId(res.athlete.id);
          setAthlete(res.athlete);
          await loadDashboardData(res.athlete.id);
        }
      } catch {
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
    setRole((res as any).role || "athlete");
    setLoggedIn(true);
    if (res.athlete) {
      setMyAthleteId(res.athlete.id);
      setAthlete(res.athlete);
      await loadDashboardData(res.athlete.id);
    }
  }

  async function handleRegister(payload: RegisterPayload) {
    const res = await register(payload);
    setToken(res.token);
    setRole(res.role);
    setLoggedIn(true);
    if (res.athlete) {
      setMyAthleteId(res.athlete.id);
      setAthlete(res.athlete);
    }
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

  // Belum login sama sekali -- tampilkan alur onboarding, bukan dashboard.
  if (!loggedIn) {
    return <OnboardingFlow onLogin={handleLogin} onRegister={handleRegister} />;
  }

  // Coach tidak punya profil atlet sendiri -- arahkan ke Coach Dashboard.
  if (role === "coach") {
    if (typeof window !== "undefined") window.location.href = "/coach";
    return null;
  }

  if (!athlete) {
    return (
      <div className="px-5 pt-8 text-center">
        <p className="text-sm text-muted">Profil tidak ditemukan. Coba login ulang.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AthleteDashboard initialAthlete={athlete} initialHistory={history} initialAlerts={alerts} />
    </div>
  );
}