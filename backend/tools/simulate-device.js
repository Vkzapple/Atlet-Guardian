/*
  Seed data dummy untuk keperluan PAPER/DEMO -- bukan data sensor asli.
  --------------------------------------------------------------------
  Generate 7 hari terakhir, 2 sesi latihan per hari (pagi & sore), dengan
  pola HR yang realistis: warm-up -> puncak intensitas -> cool-down, plus
  kelelahan yang terakumulasi menjelang akhir minggu (H-1/H-2 biasanya lebih
  tinggi fatigue score-nya dibanding awal minggu -- biar grafiknya "cerita"
  di paper, bukan flat/random).

  CARA PAKAI:
  1. Taruh file ini di backend/tools/seed-dummy-data.js
  2. Pastikan backend/.env sudah terisi SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY
  3. Jalankan dari folder backend:  node tools/seed-dummy-data.js
  4. Script akan tanya konfirmasi athleteId sebelum insert (safety check)

  PENTING: Script ini INSERT LANGSUNG ke tabel readings, TIDAK lewat AI
  service (FastAPI) -- karena tujuannya cuma buat visual/paper, bukan buat
  nguji akurasi model. Semua fatigue_score/risk_level/dst dihitung pakai
  formula sederhana di sini, bukan model AI yang sebenarnya.
*/

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import readline from "readline";

const ATHLETE_ID = "6b020ddc-e952-4759-9a6f-798cc10208e3";
const DAYS_BACK = 7;
const SESSIONS_PER_DAY = 2; // pagi & sore
const READING_INTERVAL_SEC = 60; // 1 data per menit (bukan 2 detik, biar row-nya nggak ribuan)
const SESSION_DURATION_MIN = 30; // durasi tiap sesi latihan

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.round(rand(min, max));
}

// Kurva intensitas dalam 1 sesi: warm-up (naik) -> plateau -> cool-down (turun)
function intensityCurve(t) {
  if (t < 0.2) return t / 0.2; // 0 -> 1 selama warm-up
  if (t < 0.75) return 1; // plateau
  return Math.max(0, 1 - (t - 0.75) / 0.25); // turun ke 0 saat cool-down
}

function hrZoneFromPct(pct) {
  if (pct < 60) return 1;
  if (pct < 70) return 2;
  if (pct < 80) return 3;
  if (pct < 90) return 4;
  return 5;
}

function statusFromFatigue(score) {
  if (score < 25) return "optimal";
  if (score < 50) return "caution";
  if (score < 75) return "warning";
  return "critical";
}

function riskFromFatigue(score) {
  if (score < 30) return "rendah";
  if (score < 60) return "sedang";
  if (score < 80) return "tinggi";
  return "sangat tinggi";
}

function recommendationFor(zone, status) {
  if (status === "critical") return "Hentikan latihan, istirahat total, dan pantau kondisi lebih lanjut.";
  if (status === "warning") return "Turunkan intensitas, fokus recovery, hindari zona HR tinggi.";
  if (zone >= 4) return "Latihan intensitas tinggi -- pastikan cooldown dan hidrasi cukup.";
  return "Fokus jalan cepat dan jogging ringan di Zona 1-2, intensitas sudah sesuai.";
}

const PACE_ZONES = {
  "1": { pace_range: "7:30-8:30 /km", velocity_kmh_range: [7.0, 8.0] },
  "2": { pace_range: "6:30-7:30 /km", velocity_kmh_range: [8.0, 9.2] },
  "3": { pace_range: "5:30-6:30 /km", velocity_kmh_range: [9.2, 10.9] },
  "4": { pace_range: "4:45-5:30 /km", velocity_kmh_range: [10.9, 12.6] },
  "5": { pace_range: "<4:45 /km", velocity_kmh_range: [12.6, 15.0] }
};

async function main() {
  const { data: athlete, error } = await supabase
    .from("athletes")
    .select("*")
    .eq("id", ATHLETE_ID)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!athlete) {
    console.error(`Athlete dengan id ${ATHLETE_ID} tidak ditemukan. Batal.`);
    process.exit(1);
  }

  console.log(`Athlete ditemukan: ${athlete.name} (${athlete.sport})`);
  console.log(`Akan generate ~${DAYS_BACK * SESSIONS_PER_DAY * (SESSION_DURATION_MIN)} baris data dummy.`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const confirm = await new Promise((resolve) =>
    rl.question("Lanjutkan insert ke database? (ketik 'ya' untuk lanjut): ", resolve)
  );
  rl.close();
  if (confirm.trim().toLowerCase() !== "ya") {
    console.log("Dibatalkan.");
    process.exit(0);
  }

  const restingHR = Number(athlete.resting_hr) || 65;
  const maxHR = Number(athlete.max_hr) || 190;
  const heightM = (Number(athlete.height_cm) || 165) / 100;
  const weightKg = Number(athlete.weight_kg) || 55;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

  const rows = [];
  const now = Date.now();

  for (let dayOffset = DAYS_BACK - 1; dayOffset >= 0; dayOffset--) {
    // Kelelahan mingguan: makin dekat ke hari ini (dayOffset kecil), makin
    // tinggi baseline fatigue-nya -- simulasi akumulasi latihan seminggu.
    const weeklyFatigueBase = ((DAYS_BACK - 1 - dayOffset) / (DAYS_BACK - 1)) * 30; // 0 -> 30
    const sleepHours = Math.round(rand(5.5, 8.5) * 10) / 10;
    const rpe = randInt(4, 9);

    for (let session = 0; session < SESSIONS_PER_DAY; session++) {
      const sessionHourStart = session === 0 ? 7 : 17; // pagi jam 7, sore jam 17
      const sessionStart = new Date(now - dayOffset * 24 * 3600 * 1000);
      sessionStart.setHours(sessionHourStart, randInt(0, 30), 0, 0);

      const totalReadings = Math.floor((SESSION_DURATION_MIN * 60) / READING_INTERVAL_SEC);
      let cumulativeHighZoneMin = 0;

      for (let i = 0; i < totalReadings; i++) {
        const t = i / (totalReadings - 1);
        const intensity = intensityCurve(t);
        const noise = rand(-4, 4);

        const hrCurrent = Math.round(restingHR + (maxHR - restingHR) * 0.75 * intensity + noise);
        const hrPctOfMax = Math.round((hrCurrent / maxHR) * 1000) / 10;
        const hrZone = hrZoneFromPct(hrPctOfMax);

        if (hrZone >= 4) cumulativeHighZoneMin += READING_INTERVAL_SEC / 60;

        const breathingRate = Math.round(12 + intensity * 30 + rand(-2, 2));
        const speedDeclinePct = Math.round(t * rand(0, 15));

        // Fatigue score: kombinasi intensitas saat ini + kelelahan mingguan
        // + kurang tidur + RPE self-report. Nilai 0-100.
        const sleepDebt = Math.max(0, 8 - sleepHours) * 5;
        const fatigueScore = Math.min(
          100,
          Math.round(weeklyFatigueBase + intensity * 25 + sleepDebt + rpe * 2 + rand(-5, 5))
        );

        const conditionStatus = statusFromFatigue(fatigueScore);
        const riskLevel = riskFromFatigue(fatigueScore);
        const earlyWarning = conditionStatus === "warning" || conditionStatus === "critical";

        const recordedAt = new Date(sessionStart.getTime() + i * READING_INTERVAL_SEC * 1000);

        rows.push({
          user_id: ATHLETE_ID,
          recorded_at: recordedAt.toISOString(),
          hr_current: hrCurrent,
          hr_pct_of_max: hrPctOfMax,
          breathing_rate: breathingRate,
          sleep_hours_last_night: sleepHours,
          rpe_self_report: rpe,
          speed_decline_pct: speedDeclinePct,
          duration_in_high_zone_min: Math.round(cumulativeHighZoneMin * 10) / 10,
          bmi,
          fatigue_score: fatigueScore,
          risk_level: riskLevel,
          hr_zone: hrZone,
          recommendation: recommendationFor(hrZone, conditionStatus),
          condition_status: conditionStatus,
          recovery_estimate_minutes: hrZone >= 4 ? randInt(30, 90) : randInt(10, 30),
          early_warning: earlyWarning,
          warning_reasons: earlyWarning
            ? ["Intensitas latihan tinggi berturut-turut", "Durasi di zona HR tinggi melebihi batas normal"]
            : [],
          injury_risk_percent: Math.min(90, Math.round(10 + fatigueScore * 0.3)),
          injury_risk_method: "heuristic_awal",
          next_session_recommendation: {
            target_hr_bpm: Math.round(restingHR + (maxHR - restingHR) * 0.65),
            target_hr_zone: 3,
            target_pace_range: PACE_ZONES["3"].pace_range,
            text: "Sesi berikutnya fokus di Zona 2-3 dengan durasi sedang."
          },
          pace_zones: PACE_ZONES
        });
      }
    }
  }

  console.log(`Total baris yang akan di-insert: ${rows.length}`);

  // Insert per-batch 200 baris supaya tidak melebihi limit payload request.
  const BATCH_SIZE = 200;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await supabase.from("readings").insert(batch);
    if (insertError) {
      console.error(`Gagal insert batch ${i}-${i + batch.length}:`, insertError.message);
      process.exit(1);
    }
    console.log(`Insert batch ${i}-${i + batch.length} berhasil.`);
  }

  console.log("Selesai! Data dummy sudah masuk ke tabel readings.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});