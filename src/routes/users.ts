import { Router } from "express";
import { publicUser } from "../lib/serialize.js";
import { requireAdmin } from "../middleware/auth.js";
import { User } from "../models/User.js";

export const usersRouter = Router();

usersRouter.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map(publicUser));
  } catch (error) {
    next(error);
  }
});

usersRouter.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const role = req.body.role === "admin" ? "admin" : "user";
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(publicUser(user));
  } catch (error) {
    next(error);
  }
});
