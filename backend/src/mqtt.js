import "dotenv/config";
import mqtt from "mqtt";
import { predictFatigue } from "./ai/predictClient.js";
import {
  getAthleteById,
  getAthleteHistory,
  getLatestSelfReport,
  insertReading,
  insertAlert
} from "./supabase.js";

const MQTT_URL = process.env.MQTT_URL || "mqtt://localhost:1883";
const TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || "athlete-guardian";
const READINGS_TOPIC = `${TOPIC_PREFIX}/+/readings`;

// Dipakai HANYA kalau atlet belum pernah isi self-report sama sekali,
// supaya pipeline AI tetap jalan alih-alih data di-reject total.
const DEFAULT_SLEEP_HOURS = 7;
const DEFAULT_RPE = 5;

// Firmware saat ini BELUM punya algoritma breathing rate, jadi field ini
// selalu absen dari payload hardware. Sebelumnya di-fallback ke `null`,
// padahal AI service (FastAPI) mewajibkan number valid untuk breathing_rate
// -> setiap reading selalu ditolak 422 walau hr_current-nya valid.
// Default ini adalah nilai laju napas istirahat rata-rata orang dewasa (napas/menit).
const DEFAULT_BREATHING_RATE = 16;

// hrCurrent satu-satunya field yang benar-benar WAJIB dari hardware.
// breathingRate masih opsional (firmware belum punya algoritmanya).
function validateSensorFields(payload) {
  if (typeof payload.hrCurrent !== "number") {
    return "Field 'hrCurrent' wajib ada pada payload MQTT dan bertipe number";
  }
  return null;
}

// Kalau device/app belum kirim sleep & rpe, ambil dari self-report
// terakhir yang atlet isi manual. Kalau belum pernah isi sama sekali,
// fallback ke default supaya AI service tetap bisa jalan.
async function enrichWithSelfReport(athleteId, payload) {
  const hasSleep = typeof payload.sleepHoursLastNight === "number";
  const hasRpe = typeof payload.rpeSelfReport === "number";
  const hasBreathingRate = typeof payload.breathingRate === "number";

  if (hasSleep && hasRpe && hasBreathingRate) return payload;

  let selfReport = null;
  try {
    selfReport = await getLatestSelfReport(athleteId);
  } catch (err) {
    console.error(`Gagal ambil self-report untuk ${athleteId}, pakai default:`, err.message);
  }

  return {
    ...payload,
    // FIX: dulu fallback-nya `null`, sekarang default number supaya lolos
    // validasi AI service (breathing_rate wajib number, bukan null).
    breathingRate: hasBreathingRate ? payload.breathingRate : DEFAULT_BREATHING_RATE,
    sleepHoursLastNight: hasSleep ? payload.sleepHoursLastNight : (selfReport?.sleepHoursLastNight ?? DEFAULT_SLEEP_HOURS),
    rpeSelfReport: hasRpe ? payload.rpeSelfReport : (selfReport?.rpeSelfReport ?? DEFAULT_RPE)
  };
}

export function connectMqtt() {
  console.log(">>> MQTT.JS VERSION: WILDCARD-FIX-v2 + BREATHING-RATE-FIX-v1 <<<");
  const client = mqtt.connect(MQTT_URL, {
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
    clientId: `athlete-guardian-backend-${Math.random().toString(16).slice(2, 10)}`,
    reconnectPeriod: 3000
  });

  client.on("connect", () => {
    console.log(`Terhubung ke broker EMQX di ${MQTT_URL}`);
    client.subscribe(READINGS_TOPIC, (err) => {
      if (err) console.error("Gagal subscribe topik pembacaan sensor:", err.message);
      else console.log(`Subscribe ke topik: ${READINGS_TOPIC}`);
    });
  });

  client.on("reconnect", () => console.log("Mencoba menyambung ulang ke broker EMQX..."));
  client.on("error", (err) => console.error("Kesalahan koneksi MQTT:", err.message));

  client.on("message", async (topic, payloadBuffer) => {
    const athleteId = topic.split("/")[1];

    let payload;
    try {
      payload = JSON.parse(payloadBuffer.toString());
    } catch {
      console.error(`Payload MQTT tidak valid dari topik ${topic}`);
      return;
    }

    const validationError = validateSensorFields(payload);
    if (validationError) {
      console.error(`Payload ditolak dari ${topic}: ${validationError}`);
      return;
    }

    // Catatan: kalau finger_detected false, firmware mengirim hrCurrent = 0.
    // AI service mewajibkan hr_current >= 30, jadi reading ini akan ditolak
    // di predictFatigue() (bukan bug -- memang belum ada jari di sensor).
    if (payload.hrCurrent === 0) {
      console.warn(`hrCurrent = 0 dari ${topic} (kemungkinan belum ada jari di sensor), lanjut kirim ke AI service...`);
    }

    try {
      const athlete = await getAthleteById(athleteId);
      if (!athlete) {
        console.error(`Menerima data untuk atlet yang tidak dikenal: ${athleteId}`);
        return;
      }

      const timestamp = payload.timestamp || new Date().toISOString();
      const enrichedPayload = await enrichWithSelfReport(athleteId, payload);

      let recentFatigueScores = [];
      try {
        const history = await getAthleteHistory(athleteId, 28);
        recentFatigueScores = history.map((r) => r.fatigueScore);
      } catch (histErr) {
        console.error(`Gagal ambil histori untuk ${athleteId}, lanjut tanpa ACWR:`, histErr.message);
      }

      const evaluation = await predictFatigue({ athlete, reading: enrichedPayload, recentFatigueScores });
      const reading = await insertReading(athleteId, { ...enrichedPayload, timestamp }, evaluation);

      let alert = null;
      if (evaluation.earlyWarning) {
        alert = await insertAlert({
          athleteId,
          athleteName: athlete.name,
          status: evaluation.conditionStatus,
          reasons: evaluation.warningReasons,
          fatigueScore: evaluation.fatigueScore
        });
      }

      client.publish(`${TOPIC_PREFIX}/${athleteId}/status`, JSON.stringify(reading));
      if (alert) client.publish(`${TOPIC_PREFIX}/${athleteId}/alerts`, JSON.stringify(alert));
    } catch (err) {
      console.error(`Gagal memproses pembacaan untuk atlet ${athleteId}:`, err.message);
    }
  });

  return client;
}