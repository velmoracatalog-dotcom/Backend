import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";

export const dashboardRouter = Router();

dashboardRouter.get("/stats", requireAdmin, async (_req, res, next) => {
  try {
    const [users, products, orders, reviews, revenue] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Review.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
    ]);

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(6);

    res.json({
      users,
      products,
      orders,
      reviews,
      revenue: revenue[0]?.total ?? 0,
      recentOrders: recentOrders.map((order) => ({
        id: String(order._id),
        total: order.total,
        status: order.status,
        customer: order.customer,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});
