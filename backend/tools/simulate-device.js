import "dotenv/config";
import mqtt from "mqtt";

const MQTT_URL = process.env.MQTT_URL || "mqtt://localhost:1883";
const TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || "athlete-guardian";
const ATHLETE_ID = process.argv[2];
const INTERVAL_MS = Number(process.argv[3]) || 4000;

if (!ATHLETE_ID) {
  console.error("Pemakaian: npm run simulate -- <athleteId> [intervalMs]");
  process.exit(1);
}

const client = mqtt.connect(MQTT_URL, {
  username: process.env.MQTT_USERNAME || undefined,
  password: process.env.MQTT_PASSWORD || undefined,
  clientId: `athlete-guardian-simulator-${Math.random().toString(16).slice(2, 10)}`
});

let phase = 0;
let timer = null;

function nextReading() {
  phase += 0.08;
  const exertion = (Math.sin(phase) + 1) / 2;

  return {
    hrCurrent: Math.round(65 + exertion * 120),
    breathingRate: Math.round(13 + exertion * 35),
    sleepHoursLastNight: Math.round((7.5 - exertion * 1.5) * 10) / 10,
    rpeSelfReport: Math.round(2 + exertion * 7),
    speedDeclinePct: Math.round(exertion * 25),
    durationInHighZoneMin: Math.round(exertion * 20),
    timestamp: new Date().toISOString()
  };
}

client.on("connect", () => {
  console.log(`Terhubung ke ${MQTT_URL}, mengirim data simulasi untuk atlet ${ATHLETE_ID} setiap ${INTERVAL_MS}ms...`);
  client.subscribe(`${TOPIC_PREFIX}/${ATHLETE_ID}/status`);

  timer = setInterval(() => {
    const payload = nextReading();
    client.publish(`${TOPIC_PREFIX}/${ATHLETE_ID}/readings`, JSON.stringify(payload));
    console.log(`Terkirim -> HR ${payload.hrCurrent} | RPE ${payload.rpeSelfReport} | tidur ${payload.sleepHoursLastNight}j`);
  }, INTERVAL_MS);
});

client.on("message", (topic, payloadBuffer) => {
  const result = JSON.parse(payloadBuffer.toString());
  console.log(`Hasil AI -> fatigue ${result.fatigueScore} | risiko ${result.riskLevel} | zona HR ${result.hrZone}`);
});

client.on("error", (err) => {
  console.error("Kesalahan koneksi MQTT:", err.message);
});

process.on("SIGINT", () => {
  clearInterval(timer);
  client.end();
  process.exit(0);
});
