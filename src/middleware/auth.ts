import type { NextFunction, Request, Response } from "express";
import { verifyToken, type TokenPayload } from "../lib/jwt.js";
import { User } from "../models/User.js";

export type AuthedRequest = Request & { auth?: TokenPayload };

function readToken(req: Request) {
  const cookieToken = req.cookies?.velmora_token as string | undefined;
  const header = req.header("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  return cookieToken || bearer;
}

async function loadUserFromToken(req: AuthedRequest) {
  const token = readToken(req);
  if (!token) return null;

  const payload = verifyToken(token);
  const user = await User.findById(payload.id);
  if (!user) return null;

  req.auth = {
    id: String(user._id),
    email: user.email,
    role: user.role,
  };
  return user;
}

export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  loadUserFromToken(req)
    .catch(() => {
      req.auth = undefined;
    })
    .finally(() => next());
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const user = await loadUserFromToken(req);
    if (!user || !req.auth) {
      res.status(401).json({ message: "Please sign in first" });
      return;
    }
    next();
  } catch {
    res.status(401).json({ message: "Session expired. Please sign in again." });
  }
}

export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const user = await loadUserFromToken(req);
    if (!user || !req.auth) {
      res.status(401).json({ message: "Please sign in first" });
      return;
    }
    if (user.role !== "admin") {
      res.status(403).json({ message: "Admin access required" });
      return;
    }
    next();
  } catch {
    res.status(401).json({ message: "Admin access required" });
  }
}
