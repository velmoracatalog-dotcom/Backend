import { Router } from "express";
import { requireAdmin } from "../middleware/admin.js";
import { Settings } from "../models/Settings.js";
import { serialize } from "../lib/serialize.js";

export const settingsRouter = Router();

settingsRouter.get("/", async (_req, res, next) => {
  try {
    const settings = await Settings.findOne({ key: "site" });
    res.json(settings ? serialize(settings) : null);
  } catch (error) {
    next(error);
  }
});

settingsRouter.patch("/", requireAdmin, async (req, res, next) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: "site" },
      { $set: req.body },
      { new: true, upsert: true },
    );
    res.json(serialize(settings));
  } catch (error) {
    next(error);
  }
});
