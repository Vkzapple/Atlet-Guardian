import { Router } from "express";
import {
  getUserByEmail,
  getUserByEmailAndRole,
  createUserAccount,
  createAthlete,
  getAthleteById,
  createCoachConnection
} from "../supabase.js";
import { hashPassword, verifyPassword, signToken, requireAuth } from "../auth.js";

export const authRouter = Router();

const VALID_ROLES = ["pegiat_olahraga", "athlete", "coach"];
const VALID_GENDERS = ["male", "female"];
const VALID_TRAINING_HISTORY = ["pemula", "rutin", "terlatih"];
const VALID_INJURY_HISTORY = ["tidak_ada", "lutut", "pergelangan_kaki", "punggung", "lainnya"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 * Tiga alur berbeda tergantung role:
 * - 'coach': hanya buat akun (email+password+nama), TIDAK ada profil atlet.
 * - 'athlete' / 'pegiat_olahraga': buat akun + profil fisiologis (athletes).
 *   Kalau role 'athlete' dan hasCoach=true, kirim undangan (pending) ke coach
 *   lewat coachEmail -- tapi kalau coach belum ditemukan, registrasi TETAP
 *   lanjut (tidak fail total), cuma dikasih tahu di response.
 */
authRouter.post("/register", async (req, res, next) => {
  try {
    const {
      role,
      email,
      password,
      name,
      sport,
      age,
      gender,
      heightCm,
      weightKg,
      trainingHistory,
      injuryHistory,
      hasCoach,
      coachEmail
    } = req.body || {};

    if (!email || !password || !name) {
      return res.status(400).json({ error: "name, email, dan password wajib diisi" });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "Format email tidak valid" });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: "Password minimal 8 karakter" });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `role harus salah satu dari: ${VALID_ROLES.join(", ")}` });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email sudah terdaftar. Silakan login." });
    }

    // ---- Role: COACH -- tidak butuh profil fisiologis sama sekali ----
    if (role === "coach") {
      const passwordHash = await hashPassword(password);
      const user = await createUserAccount({ email, passwordHash, athleteId: null, role: "coach" });
      const token = signToken({ userId: user.id, athleteId: null, email: user.email, role: "coach" });
      return res.status(201).json({ token, athlete: null, role: "coach" });
    }

    // ---- Role: ATHLETE / PEGIAT_OLAHRAGA -- butuh profil fisiologis ----
    if (!sport || !age || !gender || !heightCm || !weightKg || !trainingHistory) {
      return res.status(400).json({
        error: "sport, age, gender, heightCm, weightKg, dan trainingHistory wajib diisi"
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
      injuryHistory
    });

    const passwordHash = await hashPassword(password);
    const user = await createUserAccount({ email, passwordHash, athleteId: athlete.id, role });

    let coachConnectionWarning = null;
    if (role === "athlete" && hasCoach && coachEmail) {
      const coachUser = await getUserByEmailAndRole(coachEmail, "coach");
      if (coachUser) {
        await createCoachConnection(coachUser.id, athlete.id).catch((err) => {
          coachConnectionWarning = err.message;
        });
      } else {
        coachConnectionWarning = `Coach dengan email ${coachEmail} belum terdaftar. Kamu bisa hubungkan lagi nanti dari halaman Profil.`;
      }
    }

    const token = signToken({ userId: user.id, athleteId: athlete.id, email: user.email, role });

    res.status(201).json({ token, athlete, role, coachConnectionWarning });
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
    const invalidCredentials = () => res.status(401).json({ error: "Email atau password salah" });

    if (!user) return invalidCredentials();

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) return invalidCredentials();

    let athlete = null;
    if (user.athleteId) {
      athlete = await getAthleteById(user.athleteId);
      if (!athlete) {
        return res.status(404).json({ error: "Profil atlet untuk akun ini tidak ditemukan" });
      }
    }

    const token = signToken({
      userId: user.id,
      athleteId: user.athleteId,
      email: user.email,
      role: user.role
    });

    res.json({ token, athlete, role: user.role });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 */
authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    let athlete = null;
    if (req.user.athleteId) {
      athlete = await getAthleteById(req.user.athleteId);
      if (!athlete) return res.status(404).json({ error: "Profil atlet tidak ditemukan" });
    }

    res.json({ athlete, role: req.user.role });
  } catch (err) {
    next(err);
  }
});