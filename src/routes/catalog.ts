import { Router } from "express";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Review } from "../models/Review.js";
import { Settings } from "../models/Settings.js";
import { serialize, serializeProduct } from "../lib/serialize.js";

export const catalogRouter = Router();

catalogRouter.get("/", async (_req, res, next) => {
  try {
    const [products, categories, reviews, settings] = await Promise.all([
      Product.find().sort({ createdAt: 1 }),
      Category.find().sort({ order: 1 }),
      Review.find().sort({ order: 1 }),
      Settings.findOne({ key: "site" }),
    ]);

    res.json({
      products: products.map(serializeProduct),
      categories: categories.map(serialize),
      reviews: reviews.map(serialize),
      settings: settings ? serialize(settings) : null,
    });
  } catch (error) {
    next(error);
  }
});
