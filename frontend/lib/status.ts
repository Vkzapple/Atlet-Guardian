import { ConditionStatus, Gender, TrainingHistory } from "./types";

export const statusLabel: Record<ConditionStatus, string> = {
  optimal: "Optimal",
  caution: "Waspada",
  warning: "Peringatan",
  critical: "Kritis"
};

export const statusColor: Record<ConditionStatus, string> = {
  optimal: "#2FE6A3",
  caution: "#FFB84D",
  warning: "#FF8A4C",
  critical: "#FF5470"
};

export const trainingHistoryLabel: Record<TrainingHistory, string> = {
  pemula: "Pemula",
  rutin: "Rutin",
  terlatih: "Terlatih"
};

export const genderLabel: Record<Gender, string> = {
  male: "Laki-laki",
  female: "Perempuan"
};

export function formatRelativeTime(timestamp: string) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 5) return "Baru saja";
  if (diffSec < 60) return `${diffSec} detik lalu`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.round(diffMin / 60);
  return `${diffHour} jam lalu`;
}
