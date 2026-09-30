import bcrypt from "bcryptjs";
import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import multer from "multer";
import { env, hasCloudinary } from "../config/env.js";
import { uploadBuffer } from "../lib/cloudinary.js";
import { clearAuthCookie, setAuthCookie, signToken } from "../lib/jwt.js";
import { notify } from "../lib/notify.js";
import { clearEmailOtp, consumeEmailOtp, issueEmailOtp } from "../lib/otp.js";
import { publicUser } from "../lib/serialize.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { OtpChallenge } from "../models/OtpChallenge.js";
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

function replyError(res: import("express").Response, error: unknown) {
  if (error && typeof error === "object" && "status" in error && "message" in error) {
    const status = Number((error as { status: number }).status) || 400;
    const message = String((error as { message: unknown }).message);
    res.status(status).json({ message });
    return true;
  }
  return false;
}

function issueSession(res: import("express").Response, user: { _id: unknown; email: string; role: "user" | "admin" }) {
  const token = signToken({
    id: String(user._id),
    email: user.email,
    role: user.role,
  });
  setAuthCookie(res, token);
  return token;
}

type GoogleIdentity = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
};

async function readGoogleIdentity(body: {
  credential?: string;
  accessToken?: string;
}): Promise<GoogleIdentity | null> {
  if (body.credential) {
    if (!env.googleClientId) return null;
    const client = new OAuth2Client(env.googleClientId);
    const ticket = await client.verifyIdToken({
      idToken: body.credential,
      audience: env.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) return null;
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  }

  if (body.accessToken) {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${body.accessToken}` },
    });
    if (!response.ok) return null;
    const info = (await response.json()) as GoogleIdentity;
    if (!info.sub || !info.email) return null;
    return info;
  }

  return null;
}

authRouter.post("/google", async (req, res, next) => {
  try {
    const { credential, accessToken } = req.body as {
      credential?: string;
      accessToken?: string;
    };
    if (!credential && !accessToken) {
      res.status(400).json({ message: "Google sign-in is required" });
      return;
    }
    if (credential && !env.googleClientId) {
      res.status(503).json({
        message: "Add GOOGLE_CLIENT_ID to the backend environment first",
      });
      return;
    }

    const identity = await readGoogleIdentity({ credential, accessToken });
    if (!identity) {
      res.status(401).json({ message: "Google sign-in failed" });
      return;
    }

    const email = identity.email.toLowerCase();
    let user = await User.findOne({ googleId: identity.sub });
    if (!user) user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        googleId: identity.sub,
        email,
        name: identity.name ?? email.split("@")[0],
        picture: identity.picture ?? "",
        role: "user",
      });
      await notify({
        type: "user",
        title: "New user",
        body: `${user.name} joined with ${user.email}.`,
        link: "/admin/users",
        refId: String(user._id),
      });
    } else {
      if (!user.googleId) user.googleId = identity.sub;
      if (!user.picture && identity.picture) user.picture = identity.picture;
      await user.save();
    }

    const token = issueSession(res, user);
    res.json({ user: publicUser(user), token });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const email = text(req.body.email, 120).toLowerCase();
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const name = text(req.body.name, 80) || email.split("@")[0] || "Velmora";

    if (!email || !email.includes("@")) {
      res.status(400).json({ message: "A valid email is required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ message: "This email already has an account" });
      return;
    }

    try {
      await issueEmailOtp({
        email,
        purpose: "register",
        passwordHash: await bcrypt.hash(password, 10),
        name,
      });
    } catch (error) {
      if (replyError(res, error)) return;
      throw error;
    }

    res.json({ needsOtp: true, email });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const email = text(req.body.email, 120).toLowerCase();
    const password = typeof req.body.password === "string" ? req.body.password : "";

    const user = await User.findOne({ email });
    if (!user?.passwordHash) {
      res.status(401).json({ message: "Use Google, or create an email account" });
      return;
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ message: "Email or password is wrong" });
      return;
    }

    try {
      await issueEmailOtp({
        email,
        purpose: "login",
        name: user.name,
      });
    } catch (error) {
      if (replyError(res, error)) return;
      throw error;
    }

    res.json({ needsOtp: true, email });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/verify-otp", async (req, res, next) => {
  try {
    const email = text(req.body.email, 120).toLowerCase();
    const code = text(req.body.code, 8);
    if (!email || code.length !== 6) {
      res.status(400).json({ message: "Enter the 6-digit code from your email" });
      return;
    }

    let challenge: Awaited<ReturnType<typeof consumeEmailOtp>>;
    try {
      challenge = await consumeEmailOtp(email, code);
    } catch (error) {
      if (replyError(res, error)) return;
      throw error;
    }

    let user = await User.findOne({ email });
    if (challenge.purpose === "register") {
      if (user) {
        res.status(409).json({ message: "This email already has an account" });
        return;
      }
      user = await User.create({
        email,
        name: challenge.name || email.split("@")[0] || "Velmora",
        passwordHash: challenge.passwordHash,
        role: "user",
      });
      await notify({
        type: "user",
        title: "New user",
        body: `${user.name} joined with ${user.email}.`,
        link: "/admin/users",
        refId: String(user._id),
      });
    }

    if (!user) {
      res.status(401).json({ message: "No account found for this email" });
      return;
    }

    const token = issueSession(res, user);
    await clearEmailOtp(email);
    res.json({ user: publicUser(user), token });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/resend-otp", async (req, res, next) => {
  try {
    const email = text(req.body.email, 120).toLowerCase();
    const challenge = await OtpChallenge.findOne({ email });
    if (!challenge) {
      res.status(400).json({ message: "Request a new code from sign in first" });
      return;
    }

    try {
      await issueEmailOtp({
        email,
        purpose: challenge.purpose,
        passwordHash: challenge.passwordHash,
        name: challenge.name,
      });
    } catch (error) {
      if (replyError(res, error)) return;
      throw error;
    }

    res.json({ ok: true, email });
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
