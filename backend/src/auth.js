import "dotenv/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET wajib diisi di .env sebelum menjalankan backend");
}

const SALT_ROUNDS = 10;

/**
 * Meng-hash password mentah sebelum disimpan ke database.
 * Jangan pernah menyimpan password dalam bentuk teks biasa.
 */
export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Membandingkan password yang diketik user saat login dengan hash di database.
 */
export async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Membuat JWT berisi identitas user + athleteId, dipakai frontend sebagai
 * bukti login pada setiap request (header Authorization: Bearer <token>).
 */
export function signToken({ userId, athleteId, email }) {
  return jwt.sign({ sub: userId, athleteId, email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Memverifikasi & membaca isi token. Melempar error kalau token tidak
 * valid/sudah kedaluwarsa -- pemanggil (middleware) yang menangani errornya.
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Middleware Express: wajib login. Mengambil token dari header
 * "Authorization: Bearer <token>", memverifikasinya, lalu menaruh hasilnya
 * di req.user = { userId, athleteId, email } supaya bisa dipakai route berikutnya.
 */
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
      email: payload.email
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token login tidak valid atau sudah kedaluwarsa. Silakan login kembali." });
  }
}

/**
 * Middleware tambahan: memastikan user yang login hanya boleh mengakses
 * data profil atletnya sendiri (req.params.id harus sama dengan athleteId di token).
 * Dipasang SETELAH requireAuth pada route yang butuh proteksi kepemilikan.
 */
export function requireOwnAthlete(req, res, next) {
  if (req.user.athleteId !== req.params.id) {
    return res.status(403).json({ error: "Kamu tidak punya akses ke profil atlet ini" });
  }
  next();
}
