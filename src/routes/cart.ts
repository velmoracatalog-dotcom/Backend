import { Router } from "express";
import { serialize } from "../lib/serialize.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { Cart } from "../models/Cart.js";

export const cartRouter = Router();

cartRouter.get("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.auth?.id });
    res.json(cart ? serialize(cart) : { id: null, items: [] });
  } catch (error) {
    next(error);
  }
});

cartRouter.put("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const cart = await Cart.findOneAndUpdate(
      { userId: req.auth?.id },
      { userId: req.auth?.id, items },
      { new: true, upsert: true },
    );
    res.json(serialize(cart));
  } catch (error) {
    next(error);
  }
});
