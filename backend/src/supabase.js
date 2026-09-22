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
    injuryHistory: row.injury_history || "tidak_ada",
    baseline: {
      restingHR: Number(row.resting_hr),
      maxHR: Number(row.max_hr),
      calibratedAt: row.calibrated_at,
      sampleSize: row.sample_size
    },
    createdAt: row.created_at,
    photoUrl: row.photo_url || null,
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
    warningReasons: row.warning_reasons || [],
    injuryRiskPercent: row.injury_risk_percent !== null && row.injury_risk_percent !== undefined
      ? Number(row.injury_risk_percent)
      : null,
    injuryRiskMethod: row.injury_risk_method || null,
    nextSessionRecommendation: row.next_session_recommendation || {},
    paceZones: row.pace_zones || {}
  };
}

function mapAlert(row) {
  return {
    id: row.id,
    athleteId: row.user_id,
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
  injuryHistory,
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
    training_history: trainingHistory,
    injury_history: injuryHistory || "tidak_ada"
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

// ================== FOTO PROFIL (Supabase Storage) ==================
const PHOTO_BUCKET = "athlete-photos";

export async function uploadAthletePhoto(athleteId, file) {
  const ext = (file.originalname.split(".").pop() || "jpg").toLowerCase();
  const path = `${athleteId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: true // timpa foto lama kalau ada, supaya path/nama file tetap konsisten
    });
  if (uploadError) throw new Error(`Gagal upload foto: ${uploadError.message}`);

  const { data: publicUrlData } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  // Tambahkan query param cache-bust supaya browser tidak menampilkan foto lama
  // dari cache setelah upsert/ganti foto.
  const photoUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const { data: row, error } = await supabase
    .from("athletes")
    .update({ photo_url: photoUrl })
    .eq("id", athleteId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  return mapAthlete(row, null);
}

export async function removeAthletePhoto(athleteId) {
  const { data: row, error } = await supabase
    .from("athletes")
    .update({ photo_url: null })
    .eq("id", athleteId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  return mapAthlete(row, null);
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
      warning_reasons: evaluation.warningReasons,
      injury_risk_percent: evaluation.injuryRiskPercent ?? null,
      injury_risk_method: evaluation.injuryRiskMethod ?? null,
      next_session_recommendation: evaluation.nextSessionRecommendation ?? {},
      pace_zones: evaluation.paceZones ?? {}
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  return mapReading(row);
}

export async function insertAlert({ athleteId, athleteName, status, reasons, fatigueScore }) {
  const { data: row, error } = await supabase
    .from("alerts")
    .insert({
      user_id: athleteId,
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

export async function listAlerts({ athleteId, status } = {}) {
  let query = supabase.from("alerts").select("*").order("created_at", { ascending: false });
  if (athleteId) query = query.eq("user_id", athleteId);
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

// ================== AUTH: tabel users ==================
function mapSelfReport(row) {
  return {
    id: row.id,
    athleteId: row.user_id,
    sleepHoursLastNight: Number(row.sleep_hours_last_night),
    rpeSelfReport: Number(row.rpe_self_report),
    reportedAt: row.reported_at
  };
}

export async function getLatestSelfReport(athleteId) {
  const { data: row, error } = await supabase
    .from("self_reports")
    .select("*")
    .eq("user_id", athleteId)
    .order("reported_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  return mapSelfReport(row);
}

export async function upsertSelfReport(athleteId, { sleepHoursLastNight, rpeSelfReport }) {
  const { data: row, error } = await supabase
    .from("self_reports")
    .insert({
      user_id: athleteId,
      sleep_hours_last_night: sleepHoursLastNight,
      rpe_self_report: rpeSelfReport
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  return mapSelfReport(row);
}

function mapUser(row) {
  return {
    id: row.id,
    email: row.email,
    athleteId: row.athlete_id,
    role: row.role || "athlete",
    createdAt: row.created_at
    // password_hash SENGAJA tidak diikutkan supaya tidak pernah bocor ke response API
  };
}

export async function getUserByEmail(email) {
  const { data: row, error } = await supabase
    .from("users")
    .select("*")
    .ilike("email", email) // case-insensitive
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  return { ...mapUser(row), passwordHash: row.password_hash };
}

export async function getUserById(id) {
  const { data: row, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  return mapUser(row);
}

/**
 * Cari user berdasarkan email DAN role tertentu -- dipakai saat athlete
 * mengundang coach lewat email (memastikan yang diundang benar coach,
 * bukan akun pegiat_olahraga/athlete biasa).
 */
export async function getUserByEmailAndRole(email, role) {
  const user = await getUserByEmail(email);
  if (!user || user.role !== role) return null;
  return user;
}

/**
 * Membuat akun (users), opsional terhubung ke satu profil atlet (athletes).
 * athleteId boleh null untuk role 'coach' (coach tidak punya profil atlet).
 * Kalau pembuatan user gagal setelah atlet berhasil dibuat, atlet yang
 * baru dibuat itu dihapus lagi supaya tidak ada profil "yatim" tanpa akun.
 */
export async function createUserAccount({ email, passwordHash, athleteId, role }) {
  const { data: row, error } = await supabase
    .from("users")
    .insert({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      athlete_id: athleteId ?? null,
      role: role || "athlete"
    })
    .select("*")
    .single();

  if (error) {
    if (athleteId) await deleteAthlete(athleteId).catch(() => {});
    if (error.code === "23505") {
      throw new Error("Email sudah terdaftar. Silakan login atau gunakan email lain.");
    }
    throw new Error(error.message);
  }

  return mapUser(row);
}

// ================== COACH CONNECTIONS ==================
function mapConnection(row) {
  return {
    id: row.id,
    coachUserId: row.coach_user_id,
    athleteId: row.athlete_id,
    status: row.status,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at
  };
}

/**
 * Athlete mengundang coach (status awal 'pending'). Coach harus accept
 * dulu lewat acceptCoachConnection sebelum bisa lihat data atlet itu.
 */
export async function createCoachConnection(coachUserId, athleteId) {
  const { data: row, error } = await supabase
    .from("coach_connections")
    .insert({ coach_user_id: coachUserId, athlete_id: athleteId, status: "pending" })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Kamu sudah pernah mengundang coach ini sebelumnya.");
    }
    throw new Error(error.message);
  }
  return mapConnection(row);
}

/**
 * Semua koneksi milik satu coach (pending + accepted), lengkap dengan data
 * atlet masing-masing -- dipakai buat Coach Dashboard.
 */
export async function getConnectionsForCoach(coachUserId) {
  const { data: rows, error } = await supabase
    .from("coach_connections")
    .select("*")
    .eq("coach_user_id", coachUserId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const results = [];
  for (const row of rows) {
    const athlete = await getAthleteById(row.athlete_id);
    results.push({ ...mapConnection(row), athlete });
  }
  return results;
}

export async function acceptCoachConnection(connectionId, coachUserId) {
  const { data: row, error } = await supabase
    .from("coach_connections")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", connectionId)
    .eq("coach_user_id", coachUserId) // pastikan cuma coach pemilik yang bisa accept
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  return mapConnection(row);
}

/**
 * Hapus koneksi -- boleh dilakukan coach ATAU athlete yang bersangkutan
 * (masing-masing pihak bisa memutus hubungan sepihak).
 */
export async function removeCoachConnection(connectionId, { coachUserId, athleteId }) {
  let query = supabase.from("coach_connections").delete().eq("id", connectionId);
  if (coachUserId) query = query.eq("coach_user_id", coachUserId);
  if (athleteId) query = query.eq("athlete_id", athleteId);

  const { error } = await query;
  if (error) throw new Error(error.message);
}