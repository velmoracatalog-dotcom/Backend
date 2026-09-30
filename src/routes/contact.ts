import { Router } from "express";
import { notify } from "../lib/notify.js";
import { serialize } from "../lib/serialize.js";
import { optionalAuth, requireAdmin, type AuthedRequest } from "../middleware/auth.js";
import { ContactMessage } from "../models/ContactMessage.js";

export const contactRouter = Router();

function text(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

contactRouter.post("/", optionalAuth, async (req: AuthedRequest, res, next) => {
  try {
    const name = text(req.body.name, 80);
    const email = text(req.body.email, 120).toLowerCase();
    const phone = text(req.body.phone, 30);
    const subject = text(req.body.subject, 120);
    const message = text(req.body.message, 2000);

    if (!name) {
      res.status(400).json({ message: "Name is required" });
      return;
    }
    if (!email || !isEmail(email)) {
      res.status(400).json({ message: "A valid email is required" });
      return;
    }
    if (!message) {
      res.status(400).json({ message: "Please write a message" });
      return;
    }

    const created = await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      message,
      userId: req.auth?.id,
    });

    await notify({
      type: "message",
      title: "New message",
      body: `${name} wrote${subject ? `: ${subject}` : "."}`,
      link: "/admin/messages",
      refId: String(created._id),
    });
    res.status(201).json(serialize(created));
  } catch (error) {
    next(error);
  }
});

contactRouter.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages.map(serialize));
  } catch (error) {
    next(error);
  }
});

contactRouter.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const read = req.body.read === true;
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { read },
      { new: true },
    );
    if (!message) {
      res.status(404).json({ message: "Message not found" });
      return;
    }
    res.json(serialize(message));
  } catch (error) {
    next(error);
  }
});

contactRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
