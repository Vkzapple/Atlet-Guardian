export type ConditionStatus = "optimal" | "caution" | "warning" | "critical";
export type Gender = "male" | "female";
export type TrainingHistory = "pemula" | "rutin" | "terlatih";
export type InjuryHistory = "tidak_ada" | "lutut" | "pergelangan_kaki" | "punggung" | "lainnya";

export interface Baseline {
  restingHR: number;
  maxHR: number;
  calibratedAt: string | null;
  sampleSize: number;
}

export interface NextSessionRecommendation {
  target_hr_bpm?: number;
  target_hr_zone?: number;
  target_pace_range?: string;
  text?: string;
}

export interface PaceZoneInfo {
  pace_range: string;
  velocity_kmh_range: [number, number];
}

export interface Reading {
  id: string;
  athleteId: string;
  timestamp: string;
  hrCurrent: number;
  hrPctOfMax: number;
  breathingRate: number;
  sleepHoursLastNight: number;
  rpeSelfReport: number;
  speedDeclinePct: number;
  durationInHighZoneMin: number;
  bmi: number;
  fatigueScore: number;
  riskLevel: string;
  hrZone: number;
  recommendation: string;
  conditionStatus: ConditionStatus;
  recoveryEstimateMinutes: number;
  earlyWarning: boolean;
  warningReasons: string[];
  injuryRiskPercent: number | null;
  injuryRiskMethod: "acwr" | "heuristic_awal" | null;
  nextSessionRecommendation: NextSessionRecommendation;
  paceZones: Record<string, PaceZoneInfo>;
}

export interface Athlete {
  id: string;
  name: string;
  sport: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  trainingHistory: TrainingHistory;
  injuryHistory: InjuryHistory;
  baseline: Baseline;
  createdAt: string;
  photoUrl: string | null;
  latestReading: Reading | null;
}

export interface AlertItem {
  id: string;
  athleteId: string;
  athleteName: string;
  timestamp: string;
  status: ConditionStatus;
  reasons: string[];
  fatigueScore: number;
  acknowledged: boolean;
  acknowledgedAt?: string;
}