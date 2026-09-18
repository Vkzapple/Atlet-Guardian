import { Router } from "express";
import {
  getUserByEmail,
  createUserAccount,
  createAthlete,
  getAthleteById
} from "../supabase.js";
import { hashPassword, verifyPassword, signToken, requireAuth } from "../auth.js";

export const authRouter = Router();

const VALID_GENDERS = ["male", "female"];
const VALID_TRAINING_HISTORY = ["pemula", "rutin", "terlatih"];
const VALID_INJURY_HISTORY = ["tidak_ada", "lutut", "pergelangan_kaki", "punggung", "lainnya"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 * Membuat akun (email + password) SEKALIGUS profil atlet dalam satu langkah,
 * karena aplikasi ini "1 akun = 1 profil" (lihat frontend/lib/myAthlete.ts).
 */
authRouter.post("/register", async (req, res, next) => {
  try {
    const {
      email,
      password,
      name,
      sport,
      age,
      gender,
      heightCm,
      weightKg,
      trainingHistory,
      injuryHistory
    } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "email dan password wajib diisi" });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Format email tidak valid" });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: "Password minimal 8 karakter" });
    }
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

    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email sudah terdaftar. Silakan login." });
    }

    // 1) Buat profil atlet dulu
    const athlete = await createAthlete({
      name,
      sport,
      age,
      gender,
      heightCm,
      weightKg,
      trainingHistory,
      injuryHistory
    });

    // 2) Buat akun login yang terhubung ke profil itu
    const passwordHash = await hashPassword(password);
    const user = await createUserAccount({ email, passwordHash, athleteId: athlete.id });

    const token = signToken({ userId: user.id, athleteId: athlete.id, email: user.email });

    res.status(201).json({ token, athlete });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 */
authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "email dan password wajib diisi" });
    }

    const user = await getUserByEmail(email);
    // Pesan error sengaja dibuat sama (tidak membedakan "email tidak ada" vs
    // "password salah") supaya orang lain tidak bisa menebak email mana yang terdaftar.
    const invalidCredentials = () => res.status(401).json({ error: "Email atau password salah" });

    if (!user) return invalidCredentials();

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) return invalidCredentials();

    const athlete = await getAthleteById(user.athleteId);
    if (!athlete) {
      return res.status(404).json({ error: "Profil atlet untuk akun ini tidak ditemukan" });
    }

    const token = signToken({ userId: user.id, athleteId: athlete.id, email: user.email });

    res.json({ token, athlete });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Dipakai frontend untuk memvalidasi token yang tersimpan & mengambil ulang
 * profil terbaru saat aplikasi dibuka kembali.
 */
authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const athlete = await getAthleteById(req.user.athleteId);
    if (!athlete) return res.status(404).json({ error: "Profil atlet tidak ditemukan" });

    res.json({ athlete });
  } catch (err) {
    next(err);
  }
});
