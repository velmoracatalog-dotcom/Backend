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

const app = express();

app.use(
  cors({
    origin: [
      env.frontendUrl,
      "http://localhost:3000",
      "http://localhost:3001",
    ],
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "velmora-api" });
});

app.use("/api/catalog", catalogRouter);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/upload", uploadRouter);

app.use(errorHandler);

async function start() {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`Velmora API running on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
