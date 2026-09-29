import jwt from "jsonwebtoken";
import type { Response } from "express";
import { env } from "../config/env.js";

export type TokenPayload = {
  id: string;
  email: string;
  role: "user" | "admin";
};

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie("velmora_token", token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie("velmora_token", {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? "none" : "lax",
    path: "/",
  });
}
