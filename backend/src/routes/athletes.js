import { Router } from "express";
import multer from "multer";
import {
  listAthletes,
  getAthleteById,
  createAthlete,
  deleteAthlete,
  getAthleteHistory,
  getHrHistoryForCalibration,
  getBaselineInput,
  updateAthleteBaseline,
  getLatestSelfReport,
  upsertSelfReport,
  uploadAthletePhoto,
  removeAthletePhoto
} from "../supabase.js";
import { calibrateFromReadings } from "../ai/baseline.js";
import { requireAuth, requireOwnAthlete } from "../auth.js";

export const athletesRouter = Router();

const VALID_GENDERS = ["male", "female"];
const VALID_TRAINING_HISTORY = ["pemula", "rutin", "terlatih"];
const VALID_INJURY_HISTORY = ["tidak_ada", "lutut", "pergelangan_kaki", "punggung", "lainnya"];

// Foto disimpan sementara di memory (bukan disk) lalu langsung diteruskan
// ke Supabase Storage. Batas 3MB, hanya izinkan tipe image/*.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("File harus berupa gambar"));
    }
    cb(null, true);
  }
});

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
    const { name, sport, age, gender, heightCm, weightKg, trainingHistory, injuryHistory, restingHR, maxHR } =
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
    if (injuryHistory !== undefined && !VALID_INJURY_HISTORY.includes(injuryHistory)) {
      return res.status(400).json({
        error: `injuryHistory harus salah satu dari: ${VALID_INJURY_HISTORY.join(", ")}`
      });
    }

    const athlete = await createAthlete({
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

athletesRouter.post("/:id/calibrate", requireAuth, requireOwnAthlete, async (req, res, next) => {
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

// ================== FOTO PROFIL ==================
// Upload disimpan di Supabase Storage bucket "athlete-photos" (harus dibuat
// manual dan di-set PUBLIC lewat Supabase Dashboard -> Storage). URL publik
// hasil upload disimpan di kolom athletes.photo_url.

athletesRouter.post(
  "/:id/photo",
  requireAuth,
  requireOwnAthlete,
  upload.single("photo"),
  async (req, res, next) => {
    try {
      const athlete = await getAthleteById(req.params.id);
      if (!athlete) return res.status(404).json({ error: "Atlet tidak ditemukan" });
      if (!req.file) return res.status(400).json({ error: "File foto ('photo') wajib disertakan" });

      const updated = await uploadAthletePhoto(req.params.id, req.file);
      res.json({ athlete: updated });
    } catch (err) {
      next(err);
    }
  }
);

athletesRouter.delete("/:id/photo", requireAuth, requireOwnAthlete, async (req, res, next) => {
  try {
    const athlete = await getAthleteById(req.params.id);
    if (!athlete) return res.status(404).json({ error: "Atlet tidak ditemukan" });

    const updated = await removeAthletePhoto(req.params.id);
    res.json({ athlete: updated });
  } catch (err) {
    next(err);
  }
});

// ================== SELF-REPORT (sleep & RPE manual) ==================
// Field ini gak dikirim oleh hardware (sleep butuh mode sleep-tracking yang
// belum diimplementasi firmware, RPE memang harus self-report dari atlet).
// Diisi manual lewat dashboard/app, lalu di-merge oleh mqtt.js saat reading
// sensor masuk (lihat enrichWithSelfReport di mqtt.js).

athletesRouter.get("/:id/self-report/latest", requireAuth, requireOwnAthlete, async (req, res, next) => {
  try {
    const athlete = await getAthleteById(req.params.id);
    if (!athlete) return res.status(404).json({ error: "Atlet tidak ditemukan" });

    const selfReport = await getLatestSelfReport(req.params.id);
    res.json({ selfReport });
  } catch (err) {
    next(err);
  }
});

athletesRouter.post("/:id/self-report", requireAuth, requireOwnAthlete, async (req, res, next) => {
  try {
    const athlete = await getAthleteById(req.params.id);
    if (!athlete) return res.status(404).json({ error: "Atlet tidak ditemukan" });

    const { sleepHoursLastNight, rpeSelfReport } = req.body || {};

    if (typeof sleepHoursLastNight !== "number" || sleepHoursLastNight < 0 || sleepHoursLastNight > 24) {
      return res.status(400).json({ error: "sleepHoursLastNight wajib angka antara 0-24" });
    }
    if (typeof rpeSelfReport !== "number" || rpeSelfReport < 1 || rpeSelfReport > 10) {
      return res.status(400).json({ error: "rpeSelfReport wajib angka antara 1-10 (skala RPE)" });
    }

    const selfReport = await upsertSelfReport(req.params.id, { sleepHoursLastNight, rpeSelfReport });
    res.status(201).json({ selfReport });
  } catch (err) {
    next(err);
  }
});

athletesRouter.delete("/:id", requireAuth, requireOwnAthlete, async (req, res, next) => {
  try {
    const athlete = await getAthleteById(req.params.id);
    if (!athlete) return res.status(404).json({ error: "Atlet tidak ditemukan" });

    await deleteAthlete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});