import { Router } from "express";
import { listAlerts, acknowledgeAlert } from "../supabase.js";

export const alertsRouter = Router();

alertsRouter.get("/", async (req, res, next) => {
  try {
    const { userId, status } = req.query;
    const alerts = await listAlerts({ userId, status });
    res.json({ alerts });
  } catch (err) {
    next(err);
  }
});

alertsRouter.patch("/:id/acknowledge", async (req, res, next) => {
  try {
    const alert = await acknowledgeAlert(req.params.id);
    if (!alert) return res.status(404).json({ error: "Alert tidak ditemukan" });
    res.json({ alert });
  } catch (err) {
    next(err);
  }
});