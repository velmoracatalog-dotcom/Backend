import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const secret = req.header("x-admin-secret");
  if (!secret || secret !== env.adminSecret) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
}
