import "dotenv/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET wajib diisi di .env sebelum menjalankan backend");
}

const SALT_ROUNDS = 10;

export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Token sekarang menyimpan role juga ('pegiat_olahraga' | 'athlete' | 'coach'),
 * supaya middleware & frontend tahu jenis akun tanpa perlu query database lagi.
 * athleteId bisa null untuk role 'coach' (coach tidak punya profil atlet sendiri).
 */
export function signToken({ userId, athleteId, email, role }) {
  return jwt.sign({ sub: userId, athleteId, email, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token login tidak ditemukan. Silakan login kembali." });
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      userId: payload.sub,
      athleteId: payload.athleteId,
      email: payload.email,
      role: payload.role || "athlete" // fallback untuk token lama sebelum ada role
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token login tidak valid atau sudah kedaluwarsa. Silakan login kembali." });
  }
}

export function requireOwnAthlete(req, res, next) {
  if (req.user.athleteId !== req.params.id) {
    return res.status(403).json({ error: "Kamu tidak punya akses ke profil atlet ini" });
  }
  next();
}

/**
 * Middleware baru: batasi endpoint hanya untuk role tertentu.
 * Dipasang SETELAH requireAuth. Contoh: requireRole("coach")
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Endpoint ini hanya untuk role: ${allowedRoles.join(", ")}` });
    }
    next();
  };
}