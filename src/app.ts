import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { connectDb } from "./db/connect.js";
import { errorHandler } from "./middleware/error.js";
import { catalogRouter } from "./routes/catalog.js";
import { categoriesRouter } from "./routes/categories.js";
import { productsRouter } from "./routes/products.js";
import { reviewsRouter } from "./routes/reviews.js";
import { settingsRouter } from "./routes/settings.js";
import { uploadRouter } from "./routes/upload.js";

function isAllowedOrigin(origin?: string) {
  if (!origin) return true;

  const extra = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const allowed = new Set([
    env.frontendUrl,
    "http://localhost:3000",
    "http://localhost:3001",
    ...extra,
  ]);

  if (allowed.has(origin)) return true;

  try {
    return new URL(origin).hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

export const app = express();

app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    },
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "velmora-api" });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "velmora-api" });
});

app.use(async (req, res, next) => {
  if (req.path === "/" || req.path === "/api/health") {
    next();
    return;
  }

  try {
    await connectDb();
    next();
  } catch (error) {
    console.error(error);
    res.status(503).json({
      message:
        "Database unavailable. Check MONGODB_URI and Atlas Network Access (allow 0.0.0.0/0).",
    });
  }
});

app.use("/api/catalog", catalogRouter);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/upload", uploadRouter);

app.use(errorHandler);
