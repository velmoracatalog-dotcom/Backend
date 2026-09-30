import { Router } from "express";
import { serialize } from "../lib/serialize.js";
import { requireAdmin } from "../middleware/auth.js";
import { Notification } from "../models/Notification.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const items = await Notification.find().sort({ createdAt: -1 }).limit(80);
    const unread = await Notification.countDocuments({ read: false });
    res.json({ items: items.map(serialize), unread });
  } catch (error) {
    next(error);
  }
});

notificationsRouter.patch("/read-all", requireAdmin, async (_req, res, next) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

notificationsRouter.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const item = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: req.body.read !== false },
      { new: true },
    );
    if (!item) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }
    res.json(serialize(item));
  } catch (error) {
    next(error);
  }
});
