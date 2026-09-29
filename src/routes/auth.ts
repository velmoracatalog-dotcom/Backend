import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import multer from "multer";
import { env, hasCloudinary } from "../config/env.js";
import { uploadBuffer } from "../lib/cloudinary.js";
import { clearAuthCookie, setAuthCookie, signToken } from "../lib/jwt.js";
import { publicUser } from "../lib/serialize.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";

export const authRouter = Router();

const pictureUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, done) => {
    if (!file.mimetype.startsWith("image/")) {
      done(new Error("Please choose an image"));
      return;
    }
    done(null, true);
  },
});

function text(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

authRouter.post("/google", async (req, res, next) => {
  try {
    const { credential } = req.body as { credential?: string };
    if (!credential) {
      res.status(400).json({ message: "Google credential is required" });
      return;
    }
    if (!env.googleClientId) {
      res.status(503).json({
        message: "Add GOOGLE_CLIENT_ID to the backend environment first",
      });
      return;
    }

    const client = new OAuth2Client(env.googleClientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      res.status(401).json({ message: "Google sign-in failed" });
      return;
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email,
        name: payload.name ?? email.split("@")[0],
        picture: payload.picture ?? "",
        role: "user",
      });
    } else {
      user.email = email;
      if (!user.picture && payload.picture) user.picture = payload.picture;
      await user.save();
    }

    const token = signToken({
      id: String(user._id),
      email: user.email,
      role: user.role,
    });
    setAuthCookie(res, token);
    res.json({ user: publicUser(user), token });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const user = await User.findById(req.auth?.id);
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.patch("/profile", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const user = await User.findById(req.auth?.id);
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    const name = text(req.body.name, 80);
    if (!name) {
      res.status(400).json({ message: "Name is required" });
      return;
    }

    user.name = name;
    user.phone = text(req.body.phone, 30);
    user.address = text(req.body.address, 300);
    user.city = text(req.body.city, 80);
    user.postalCode = text(req.body.postalCode, 20);
    user.country = text(req.body.country, 80) || "Pakistan";
    await user.save();

    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post(
  "/picture",
  requireAuth,
  pictureUpload.single("file"),
  async (req: AuthedRequest, res, next) => {
    try {
      if (!hasCloudinary()) {
        res.status(503).json({
          message: "Add Cloudinary credentials to backend/.env first",
        });
        return;
      }
      if (!req.file) {
        res.status(400).json({ message: "Please choose a photo" });
        return;
      }

      const user = await User.findById(req.auth?.id);
      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }

      const uploaded = await uploadBuffer(req.file.buffer, "velmora/avatars");
      user.picture = uploaded.url;
      await user.save();
      res.json({ user: publicUser(user) });
    } catch (error) {
      next(error);
    }
  },
);

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});
