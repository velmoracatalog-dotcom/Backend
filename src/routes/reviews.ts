import { Router } from "express";
import { requireAdmin } from "../middleware/admin.js";
import { Review } from "../models/Review.js";
import { serialize } from "../lib/serialize.js";

export const reviewsRouter = Router();

reviewsRouter.get("/", async (_req, res, next) => {
  try {
    const reviews = await Review.find().sort({ order: 1 });
    res.json(reviews.map(serialize));
  } catch (error) {
    next(error);
  }
});

reviewsRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const review = await Review.create(req.body);
    res.status(201).json(serialize(review));
  } catch (error) {
    next(error);
  }
});

reviewsRouter.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!review) {
      res.status(404).json({ message: "Review not found" });
      return;
    }
    res.json(serialize(review));
  } catch (error) {
    next(error);
  }
});

reviewsRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
