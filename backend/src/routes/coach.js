import { Router } from "express";
import {
  getUserByEmailAndRole,
  createCoachConnection,
  getConnectionsForCoach,
  acceptCoachConnection,
  removeCoachConnection
} from "../supabase.js";
import { requireAuth, requireRole } from "../auth.js";

export const coachRouter = Router();

/**
 * POST /api/coach/connect
 * Dipanggil oleh ATHLETE untuk mengundang coach (lewat email coach).
 * Status awal 'pending' -- coach harus accept dulu di endpoint di bawah.
 */
coachRouter.post("/connect", requireAuth, requireRole("athlete"), async (req, res, next) => {
  try {
    const { coachEmail } = req.body || {};
    if (!coachEmail) return res.status(400).json({ error: "coachEmail wajib diisi" });

    const coachUser = await getUserByEmailAndRole(coachEmail, "coach");
    if (!coachUser) {
      return res.status(404).json({ error: `Coach dengan email ${coachEmail} tidak ditemukan` });
    }

    const connection = await createCoachConnection(coachUser.id, req.user.athleteId);
    res.status(201).json({ connection });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/coach/athletes
 * Dipanggil oleh COACH untuk lihat semua atlet yang terhubung (pending + accepted).
 * Coach Dashboard filter sendiri mana yang mau ditampilkan berdasarkan status.
 */
coachRouter.get("/athletes", requireAuth, requireRole("coach"), async (req, res, next) => {
  try {
    const connections = await getConnectionsForCoach(req.user.userId);
    res.json({ connections });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/coach/connect/:id/accept
 * Coach menerima undangan dari atlet.
 */
coachRouter.patch("/connect/:id/accept", requireAuth, requireRole("coach"), async (req, res, next) => {
  try {
    const connection = await acceptCoachConnection(req.params.id, req.user.userId);
    if (!connection) return res.status(404).json({ error: "Koneksi tidak ditemukan" });
    res.json({ connection });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/coach/connect/:id
 * Bisa dipanggil coach ATAU athlete yang bersangkutan untuk putus koneksi.
 */
coachRouter.delete("/connect/:id", requireAuth, async (req, res, next) => {
  try {
    const filter =
      req.user.role === "coach" ? { coachUserId: req.user.userId } : { athleteId: req.user.athleteId };

    await removeCoachConnection(req.params.id, filter);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});