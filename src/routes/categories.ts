import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { Category } from "../models/Category.js";
import { serialize } from "../lib/serialize.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res, next) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    res.json(categories.map(serialize));
  } catch (error) {
    next(error);
  }
});

categoriesRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(serialize(category));
  } catch (error) {
    next(error);
  }
});

categoriesRouter.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    res.json(serialize(category));
  } catch (error) {
    next(error);
  }
});

categoriesRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
