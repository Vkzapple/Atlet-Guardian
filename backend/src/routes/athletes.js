import { Router } from "express";
import {
  listAthletes,
  getAthleteById,
  createAthlete,
  deleteAthlete,
  getAthleteHistory,
  getHrHistoryForCalibration,
  getBaselineInput,
  updateAthleteBaseline
} from "../supabase.js";
import { calibrateFromReadings } from "../ai/baseline.js";

export const athletesRouter = Router();

const VALID_GENDERS = ["male", "female"];
const VALID_TRAINING_HISTORY = ["pemula", "rutin", "terlatih"];

athletesRouter.get("/", async (req, res, next) => {
  try {
    const athletes = await listAthletes();
    res.json({ athletes });
  } catch (err) {
    next(err);
  }
});

athletesRouter.post("/", async (req, res, next) => {
  try {
    const { name, sport, age, gender, heightCm, weightKg, trainingHistory, restingHR, maxHR } =
      req.body || {};

    if (!name || !sport || !age || !gender || !heightCm || !weightKg || !trainingHistory) {
      return res.status(400).json({
        error: "name, sport, age, gender, heightCm, weightKg, dan trainingHistory wajib diisi"
      });
    }
    if (!VALID_GENDERS.includes(gender)) {
      return res.status(400).json({ error: "gender harus 'male' atau 'female'" });
    }
    if (!VALID_TRAINING_HISTORY.includes(trainingHistory)) {
      return res.status(400).json({ error: "trainingHistory harus pemula, rutin, atau terlatih" });
    }

    const athlete = await createAthlete({
      name,
      sport,
      age,
      gender,
      heightCm,
      weightKg,
      trainingHistory,
      restingHR,
      maxHR
    });
    res.status(201).json({ athlete });
  } catch (err) {
    next(err);
  }
});

athletesRouter.get("/:id", async (req, res, next) => {
  try {
    const athlete = await getAthleteById(req.params.id);
    if (!athlete) return res.status(404).json({ error: "Atlet tidak ditemukan" });
    res.json({ athlete });
  } catch (err) {
    next(err);
  }
});

athletesRouter.get("/:id/history", async (req, res, next) => {
  try {
    const athlete = await getAthleteById(req.params.id);
    if (!athlete) return res.status(404).json({ error: "Atlet tidak ditemukan" });

    const limit = Math.min(Number(req.query.limit) || 60, 500);
    const history = await getAthleteHistory(req.params.id, limit);
    res.json({ history });
  } catch (err) {
    next(err);
  }
});

athletesRouter.post("/:id/calibrate", async (req, res, next) => {
  try {
    const baseline = await getBaselineInput(req.params.id);
    if (!baseline) return res.status(404).json({ error: "Atlet tidak ditemukan" });

    const hrReadings = await getHrHistoryForCalibration(req.params.id);
    if (hrReadings.length < 5) {
      return res.status(400).json({
        error: "Minimal 5 data pembacaan sensor diperlukan sebelum kalibrasi baseline"
      });
    }

    const newBaseline = calibrateFromReadings(hrReadings, baseline);
    const athlete = await updateAthleteBaseline(req.params.id, newBaseline);
    res.json({ athlete });
  } catch (err) {
    next(err);
  }
});

athletesRouter.delete("/:id", async (req, res, next) => {
  try {
    const athlete = await getAthleteById(req.params.id);
    if (!athlete) return res.status(404).json({ error: "Atlet tidak ditemukan" });

    await deleteAthlete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
