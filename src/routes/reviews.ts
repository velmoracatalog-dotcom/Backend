import { Router } from "express";
import mongoose from "mongoose";
import { serialize } from "../lib/serialize.js";
import { requireAdmin, requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { Product } from "../models/Product.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";

export const reviewsRouter = Router();

reviewsRouter.get("/", async (req, res, next) => {
  try {
    const filter =
      req.query.all === "1" ? {} : { $or: [{ visible: true }, { visible: { $exists: false } }] };
    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json(reviews.map(serialize));
  } catch (error) {
    next(error);
  }
});

reviewsRouter.post("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { quote, rating, productId } = req.body as {
      quote?: string;
      rating?: number;
      productId?: string;
    };
    if (!quote?.trim()) {
      res.status(400).json({ message: "Please write a review" });
      return;
    }

    const user = await User.findById(req.auth?.id);
    const product = productId
      ? await Product.findOne(
          mongoose.isValidObjectId(productId)
            ? { $or: [{ _id: productId }, { slug: productId }] }
            : { slug: productId },
        )
      : null;

    const review = await Review.create({
      quote: quote.trim(),
      author: user?.name ?? "Verified Customer",
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      userId: req.auth?.id,
      productId: product ? String(product._id) : productId,
      productName: product?.name,
      visible: true,
    });

    if (product) {
      const stats = await Review.aggregate([
        { $match: { productId: String(product._id), visible: { $ne: false } } },
        { $group: { _id: null, avg: { $avg: "$rating" } } },
      ]);
      if (stats[0]?.avg) {
        product.rating = Math.round(stats[0].avg);
        await product.save();
      }
    }

    res.status(201).json(serialize(review));
  } catch (error) {
    next(error);
  }
});

reviewsRouter.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
