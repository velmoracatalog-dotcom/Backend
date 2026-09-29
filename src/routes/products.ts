import { Router } from "express";
import mongoose from "mongoose";
import { requireAdmin } from "../middleware/auth.js";
import { Product } from "../models/Product.js";
import { serializeProduct } from "../lib/serialize.js";

export const productsRouter = Router();

productsRouter.get("/", async (_req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: 1 });
    res.json(products.map(serializeProduct));
  } catch (error) {
    next(error);
  }
});

productsRouter.get("/:slug", async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const product = await Product.findOne(
      mongoose.isValidObjectId(slug) ? { $or: [{ slug }, { _id: slug }] } : { slug },
    );
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.json(serializeProduct(product));
  } catch (error) {
    next(error);
  }
});

productsRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(serializeProduct(product));
  } catch (error) {
    next(error);
  }
});

productsRouter.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.json(serializeProduct(product));
  } catch (error) {
    next(error);
  }
});

productsRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
