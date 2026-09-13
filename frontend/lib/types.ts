export type ConditionStatus = "optimal" | "caution" | "warning" | "critical";
export type Gender = "male" | "female";
export type TrainingHistory = "pemula" | "rutin" | "terlatih";

export interface Baseline {
  restingHR: number;
  maxHR: number;
  calibratedAt: string | null;
  sampleSize: number;
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
  baseline: Baseline;
  createdAt: string;
  latestReading: Reading | null;
}

export interface AlertItem {
  id: string;
  userId: string;
  athleteName: string;
  timestamp: string;
  status: ConditionStatus;
  reasons: string[];
  fatigueScore: number;
  acknowledged: boolean;
  acknowledgedAt?: string;
}