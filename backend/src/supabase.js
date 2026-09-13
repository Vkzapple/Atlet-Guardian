import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di .env sebelum menjalankan backend"
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

function mapAthlete(row, latestReadingRow) {
  return {
    id: row.id,
    name: row.name,
    sport: row.sport,
    age: row.age,
    gender: row.gender,
    heightCm: Number(row.height_cm),
    weightKg: Number(row.weight_kg),
    trainingHistory: row.training_history,
    baseline: {
      restingHR: Number(row.resting_hr),
      maxHR: Number(row.max_hr),
      calibratedAt: row.calibrated_at,
      sampleSize: row.sample_size
    },
    createdAt: row.created_at,
    latestReading: latestReadingRow ? mapReading(latestReadingRow) : null
  };
}

function mapReading(row) {
  return {
    id: row.id,
    athleteId: row.user_id,
    timestamp: row.recorded_at,
    hrCurrent: Number(row.hr_current),
    hrPctOfMax: Number(row.hr_pct_of_max),
    breathingRate: Number(row.breathing_rate),
    sleepHoursLastNight: Number(row.sleep_hours_last_night),
    rpeSelfReport: Number(row.rpe_self_report),
    speedDeclinePct: Number(row.speed_decline_pct),
    durationInHighZoneMin: Number(row.duration_in_high_zone_min),
    bmi: Number(row.bmi),
    fatigueScore: Number(row.fatigue_score),
    riskLevel: row.risk_level,
    hrZone: row.hr_zone,
    recommendation: row.recommendation,
    conditionStatus: row.condition_status,
    recoveryEstimateMinutes: row.recovery_estimate_minutes,
    earlyWarning: row.early_warning,
    warningReasons: row.warning_reasons || []
  };
}

function mapAlert(row) {
  return {
    id: row.id,
    userId: row.user_id,
    athleteName: row.athlete_name,
    timestamp: row.created_at,
    status: row.status,
    reasons: row.reasons || [],
    fatigueScore: Number(row.fatigue_score),
    acknowledged: row.acknowledged,
    acknowledgedAt: row.acknowledged_at
  };
}

export async function listAthletes() {
  const { data: athletes, error } = await supabase
    .from("athletes")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  if (athletes.length === 0) return [];

  const { data: latestReadings, error: readingsError } = await supabase
    .from("latest_readings")
    .select("*")
    .in("user_id", athletes.map((a) => a.id));
  if (readingsError) throw new Error(readingsError.message);

  const latestByAthlete = new Map(latestReadings.map((r) => [r.user_id, r]));
  return athletes.map((row) => mapAthlete(row, latestByAthlete.get(row.id)));
}

export async function getAthleteById(id) {
  const { data: row, error } = await supabase.from("athletes").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  const { data: latest, error: latestError } = await supabase
    .from("latest_readings")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();
  if (latestError) throw new Error(latestError.message);

  return mapAthlete(row, latest);
}

export async function createAthlete({
  name,
  sport,
  age,
  gender,
  heightCm,
  weightKg,
  trainingHistory,
  restingHR,
  maxHR
}) {
  const insertPayload = {
    name,
    sport,
    age,
    gender,
    height_cm: heightCm,
    weight_kg: weightKg,
    training_history: trainingHistory
  };
  if (restingHR) insertPayload.resting_hr = restingHR;
  if (maxHR) insertPayload.max_hr = maxHR;
  else insertPayload.max_hr = 208 - 0.7 * age;

  const { data: row, error } = await supabase
    .from("athletes")
    .insert(insertPayload)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  return mapAthlete(row, null);
}

export async function deleteAthlete(id) {
  const { error } = await supabase.from("athletes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getAthleteHistory(id, limit = 60) {
  const { data, error } = await supabase
    .from("readings")
    .select("*")
    .eq("user_id", id)
    .order("recorded_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  return data.map(mapReading).reverse();
}

export async function getBaselineInput(id) {
  const { data: row, error } = await supabase.from("athletes").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  return {
    restingHR: Number(row.resting_hr),
    maxHR: Number(row.max_hr),
    calibratedAt: row.calibrated_at,
    sampleSize: row.sample_size
  };
}

export async function getHrHistoryForCalibration(athleteId) {
  const { data, error } = await supabase
    .from("readings")
    .select("hr_current")
    .eq("user_id", athleteId);
  if (error) throw new Error(error.message);

  return data.map((r) => Number(r.hr_current));
}

export async function updateAthleteBaseline(athleteId, baseline) {
  const { data: row, error } = await supabase
    .from("athletes")
    .update({
      resting_hr: baseline.restingHR,
      calibrated_at: baseline.calibratedAt,
      sample_size: baseline.sampleSize
    })
    .eq("id", athleteId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  return mapAthlete(row, null);
}

export async function getRecentReadings(athleteId, limit = 10) {
  const { data, error } = await supabase
    .from("readings")
    .select("*")
    .eq("user_id", athleteId)
    .order("recorded_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  return data.map(mapReading);
}

export async function insertReading(athleteId, reading, evaluation) {
  const { data: row, error } = await supabase
    .from("readings")
    .insert({
      user_id: athleteId,
      recorded_at: reading.timestamp,
      hr_current: reading.hrCurrent,
      hr_pct_of_max: evaluation.hrPctOfMax,
      breathing_rate: reading.breathingRate,
      sleep_hours_last_night: reading.sleepHoursLastNight,
      rpe_self_report: reading.rpeSelfReport,
      speed_decline_pct: reading.speedDeclinePct ?? 0,
      duration_in_high_zone_min: reading.durationInHighZoneMin ?? 0,
      bmi: evaluation.bmi,
      fatigue_score: evaluation.fatigueScore,
      risk_level: evaluation.riskLevel,
      hr_zone: evaluation.hrZone,
      recommendation: evaluation.recommendation,
      condition_status: evaluation.conditionStatus,
      recovery_estimate_minutes: evaluation.recoveryEstimateMinutes,
      early_warning: evaluation.earlyWarning,
      warning_reasons: evaluation.warningReasons
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  return mapReading(row);
}

export async function insertAlert({ userId, athleteName, status, reasons, fatigueScore }) {
  const { data: row, error } = await supabase
    .from("alerts")
    .insert({
      user_id: userId,
      athlete_name: athleteName,
      status,
      reasons,
      fatigue_score: fatigueScore
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  return mapAlert(row);
}

export async function listAlerts({ userId, status } = {}) {
  let query = supabase.from("alerts").select("*").order("created_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);
  if (status === "active") query = query.eq("acknowledged", false);
  if (status === "acknowledged") query = query.eq("acknowledged", true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data.map(mapAlert);
}

export async function acknowledgeAlert(id) {
  const { data: row, error } = await supabase
    .from("alerts")
    .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  return mapAlert(row);
}