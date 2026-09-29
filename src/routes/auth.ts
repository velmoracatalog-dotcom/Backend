import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import { clearAuthCookie, setAuthCookie, signToken } from "../lib/jwt.js";
import { publicUser } from "../lib/serialize.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";

export const authRouter = Router();

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
      user.name = payload.name ?? user.name;
      user.picture = payload.picture ?? user.picture;
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

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});
