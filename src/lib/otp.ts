import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { sendOtpEmail } from "./mail.js";
import { OtpChallenge } from "../models/OtpChallenge.js";

const OTP_MINUTES = 10;
const RESEND_SECONDS = 45;

export async function issueEmailOtp(input: {
  email: string;
  purpose: "login" | "register";
  passwordHash?: string;
  name?: string;
}) {
  const existing = await OtpChallenge.findOne({ email: input.email });
  if (existing?.sentAt && Date.now() - existing.sentAt.getTime() < RESEND_SECONDS * 1000) {
    const wait = Math.ceil(
      (RESEND_SECONDS * 1000 - (Date.now() - existing.sentAt.getTime())) / 1000,
    );
    throw Object.assign(new Error(`Wait ${wait}s before requesting another code`), {
      status: 429,
    });
  }

  const code = String(randomInt(100000, 1000000));
  try {
    await sendOtpEmail(input.email, code);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not send the OTP email";
    throw Object.assign(new Error(message), { status: 503 });
  }
  await OtpChallenge.findOneAndUpdate(
    { email: input.email },
    {
      email: input.email,
      purpose: input.purpose,
      codeHash: await bcrypt.hash(code, 10),
      passwordHash: input.passwordHash ?? existing?.passwordHash ?? "",
      name: input.name ?? existing?.name ?? "",
      attempts: 0,
      expiresAt: new Date(Date.now() + OTP_MINUTES * 60 * 1000),
      sentAt: new Date(),
    },
    { upsert: true, returnDocument: "after" },
  );
}

export async function consumeEmailOtp(email: string, code: string) {
  const challenge = await OtpChallenge.findOne({ email });
  if (!challenge) {
    throw Object.assign(new Error("Request a new code first"), { status: 400 });
  }
  if (challenge.expiresAt.getTime() < Date.now()) {
    await challenge.deleteOne();
    throw Object.assign(new Error("This code has expired"), { status: 400 });
  }
  if (challenge.attempts >= 5) {
    await challenge.deleteOne();
    throw Object.assign(new Error("Too many attempts. Request a new code"), { status: 400 });
  }

  const ok = await bcrypt.compare(code.trim(), challenge.codeHash);
  if (!ok) {
    challenge.attempts += 1;
    await challenge.save();
    throw Object.assign(new Error("That code is wrong"), { status: 401 });
  }

  return {
    purpose: challenge.purpose as "login" | "register",
    passwordHash: challenge.passwordHash as string,
    name: challenge.name as string,
  };
}

export async function clearEmailOtp(email: string) {
  await OtpChallenge.deleteOne({ email });
}
