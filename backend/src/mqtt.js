import "dotenv/config";
import mqtt from "mqtt";
import { predictFatigue } from "./ai/predictClient.js";
import { getAthleteById, getAthleteHistory, insertReading, insertAlert } from "./supabase.js";

const MQTT_URL = process.env.MQTT_URL || "mqtt://localhost:1883";
const TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || "athlete-guardian";
const READINGS_TOPIC = `${TOPIC_PREFIX}/+/readings`;

function requiredFields(payload) {
  const required = ["hrCurrent", "breathingRate", "sleepHoursLastNight", "rpeSelfReport"];
  for (const field of required) {
    if (payload[field] === undefined || payload[field] === null || typeof payload[field] !== "number") {
      return `Field '${field}' wajib ada pada payload MQTT dan bertipe number`;
    }
  }
  return null;
}

export function connectMqtt() {
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

  client.on("reconnect", () => {
    console.log("Mencoba menyambung ulang ke broker EMQX...");
  });

  client.on("error", (err) => {
    console.error("Kesalahan koneksi MQTT:", err.message);
  });

  client.on("message", async (topic, payloadBuffer) => {
    const athleteId = topic.split("/")[1];

    let payload;
    try {
      payload = JSON.parse(payloadBuffer.toString());
    } catch {
      console.error(`Payload MQTT tidak valid dari topik ${topic}`);
      return;
    }

    const validationError = requiredFields(payload);
    if (validationError) {
      console.error(`Payload ditolak dari ${topic}: ${validationError}`);
      return;
    }

    try {
      const athlete = await getAthleteById(athleteId);
      if (!athlete) {
        console.error(`Menerima data untuk atlet yang tidak dikenal: ${athleteId}`);
        return;
      }

      const timestamp = payload.timestamp || new Date().toISOString();

      // Ambil histori fatigue_score (s.d. 28 sesi terakhir, kronologis lama->baru)
      // buat dikirim ke AI service -- dipakai buat hitung ACWR injury risk.
      // Kalau gagal ambil histori, tetap lanjut prediksi tanpa histori (fallback
      // heuristik di AI service akan otomatis dipakai).
      let recentFatigueScores = [];
      try {
        const history = await getAthleteHistory(athleteId, 28);
        recentFatigueScores = history.map((r) => r.fatigueScore);
      } catch (histErr) {
        console.error(`Gagal ambil histori untuk ${athleteId}, lanjut tanpa ACWR:`, histErr.message);
      }

      const evaluation = await predictFatigue({ athlete, reading: payload, recentFatigueScores });

      const reading = await insertReading(athleteId, { ...payload, timestamp }, evaluation);

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
      if (alert) {
        client.publish(`${TOPIC_PREFIX}/${athleteId}/alerts`, JSON.stringify(alert));
      }
    } catch (err) {
      console.error(`Gagal memproses pembacaan untuk atlet ${athleteId}:`, err.message);
    }
  });

  return client;
}
