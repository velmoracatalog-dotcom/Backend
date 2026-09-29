import { Router } from "express";
import multer from "multer";
import { requireAdmin } from "../middleware/auth.js";
import { hasCloudinary } from "../config/env.js";
import { uploadBuffer } from "../lib/cloudinary.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

export const uploadRouter = Router();

uploadRouter.post("/", requireAdmin, upload.single("file"), async (req, res, next) => {
  try {
    if (!hasCloudinary()) {
      res.status(503).json({
        message: "Add Cloudinary credentials to backend/.env first",
      });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }
    const result = await uploadBuffer(req.file.buffer);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
