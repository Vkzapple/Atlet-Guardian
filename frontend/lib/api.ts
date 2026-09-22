import { AlertItem, Athlete, Gender, InjuryHistory, Reading, TrainingHistory } from "./types";
import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Permintaan gagal" }));
    throw new Error(body.error || "Permintaan gagal");
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export function login(payload: { email: string; password: string }) {
  return request<{ token: string; athlete: Athlete }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function register(payload: {
  role: "pegiat_olahraga" | "athlete" | "coach";
  email: string;
  password: string;
  name: string;
  sport?: string;
  age?: number;
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  trainingHistory?: TrainingHistory;
  injuryHistory?: InjuryHistory;
  hasCoach?: boolean;
  coachEmail?: string;
}) {
  return request<{ token: string; athlete: Athlete | null; role: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getMe() {
  return request<{ athlete: Athlete | null; role: string }>("/api/auth/me");
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

// Upload foto pakai FormData, jadi TIDAK lewat request() -- helper itu selalu
// set Content-Type: application/json, yang akan merusak multipart upload
// (browser wajib set Content-Type multipart/form-data + boundary sendiri).
export async function uploadAthletePhoto(id: string, file: File) {
  const token = getToken();
  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch(`${API_URL}/api/athletes/${id}/photo`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
      // sengaja TIDAK set Content-Type di sini
    },
    body: formData,
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Gagal upload foto" }));
    throw new Error(body.error || "Gagal upload foto");
  }

  return response.json() as Promise<{ athlete: Athlete }>;
}

export function removeAthletePhoto(id: string) {
  return request<{ athlete: Athlete }>(`/api/athletes/${id}/photo`, {
    method: "DELETE"
  });
}

// ================== COACH ==================
export function getCoachAthletes() {
  return request<{ connections: Array<{ id: string; status: string; athlete: Athlete }> }>(
    "/api/coach/athletes"
  );
}

export function connectCoach(coachEmail: string) {
  return request<{ connection: { id: string; status: string } }>("/api/coach/connect", {
    method: "POST",
    body: JSON.stringify({ coachEmail })
  });
}

export function acceptCoachConnection(connectionId: string) {
  return request<{ connection: { id: string; status: string } }>(
    `/api/coach/connect/${connectionId}/accept`,
    { method: "PATCH" }
  );
}

export function removeCoachConnection(connectionId: string) {
  return request<void>(`/api/coach/connect/${connectionId}`, { method: "DELETE" });
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