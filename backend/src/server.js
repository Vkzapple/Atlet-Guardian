import "dotenv/config";
import express from "express";
import cors from "cors";
import { athletesRouter } from "./routes/athletes.js";
import { alertsRouter } from "./routes/alerts.js";
import { authRouter } from "./routes/auth.js";
import { coachRouter } from "./routes/coach.js";
import { connectMqtt } from "./mqtt.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "athlete-guardian-backend" });
});

app.use("/api/auth", authRouter);
app.use("/api/athletes", athletesRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/coach", coachRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Terjadi kesalahan pada server" });
});

connectMqtt();

app.listen(port, "0.0.0.0", () => {
  console.log(`Athlete Guardian backend berjalan di 0.0.0.0:${port}`);
});