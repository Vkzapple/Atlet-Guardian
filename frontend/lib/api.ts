import { AlertItem, Athlete, Gender, InjuryHistory, Reading, TrainingHistory } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Permintaan gagal" }));
    throw new Error(body.error || "Permintaan gagal");
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export function getAthletes() {
  return request<{ athletes: Athlete[] }>("/api/athletes");
}

export function getAthlete(id: string) {
  return request<{ athlete: Athlete }>(`/api/athletes/${id}`);
}

export function getAthleteHistory(id: string, limit = 60) {
  return request<{ history: Reading[] }>(`/api/athletes/${id}/history?limit=${limit}`);
}

export function createAthlete(payload: {
  name: string;
  sport: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  trainingHistory: TrainingHistory;
  injuryHistory?: InjuryHistory;
  restingHR?: number;
  maxHR?: number;
}) {
  return request<{ athlete: Athlete }>("/api/athletes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function calibrateAthlete(id: string) {
  return request<{ athlete: Athlete }>(`/api/athletes/${id}/calibrate`, {
    method: "POST"
  });
}

export function deleteAthlete(id: string) {
  return request<void>(`/api/athletes/${id}`, { method: "DELETE" });
}

export function getAlerts(params?: { athleteId?: string; status?: "active" | "acknowledged" }) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return request<{ alerts: AlertItem[] }>(`/api/alerts${query ? `?${query}` : ""}`);
}

export function acknowledgeAlert(id: string) {
  return request<{ alert: AlertItem }>(`/api/alerts/${id}/acknowledge`, {
    method: "PATCH"
  });
}
