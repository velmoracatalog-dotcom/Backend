import { Router } from "express";
import { notify } from "../lib/notify.js";
import { serialize } from "../lib/serialize.js";
import { requireAdmin, requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";

export const ordersRouter = Router();

ordersRouter.get("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    if (req.auth?.role === "admin") {
      const orders = await Order.find().sort({ createdAt: -1 });
      res.json(orders.map(serialize));
      return;
    }
    const orders = await Order.find({ userId: req.auth?.id }).sort({ createdAt: -1 });
    res.json(orders.map(serialize));
  } catch (error) {
    next(error);
  }
});

ordersRouter.post("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { items, customer } = req.body as {
      items?: Array<{
        productId: string;
        slug?: string;
        name: string;
        image: string;
        price: number;
        quantity: number;
      }>;
      customer?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
        city?: string;
      };
    };

    if (!items?.length) {
      res.status(400).json({ message: "Your cart is empty" });
      return;
    }
    if (!customer?.phone || !customer.address || !customer.city) {
      res.status(400).json({ message: "Phone, address, and city are required" });
      return;
    }

    const user = await User.findById(req.auth?.id);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await Order.create({
      userId: req.auth?.id,
      items,
      total,
      status: "pending",
      customer: {
        name: customer.name || user?.name,
        email: customer.email || user?.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
      },
    });

    await Cart.findOneAndUpdate({ userId: req.auth?.id }, { items: [] });
    await notify({
      type: "order",
      title: "New order",
      body: `${order.customer?.name || "A guest"} placed an order of Rs. ${order.total}.`,
      link: "/admin/orders",
      refId: String(order._id),
    });
    res.status(201).json(serialize(order));
  } catch (error) {
    next(error);
  }
});

ordersRouter.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const allowed = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(req.body.status)) {
      res.status(400).json({ message: "Invalid order status" });
      return;
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    res.json(serialize(order));
  } catch (error) {
    next(error);
  }
});
