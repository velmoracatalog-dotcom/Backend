import mongoose, { Schema } from "mongoose";

const otpChallengeSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    purpose: { type: String, enum: ["login", "register"], required: true },
    codeHash: { type: String, required: true },
    passwordHash: { type: String, default: "" },
    name: { type: String, default: "" },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpChallenge =
  mongoose.models.OtpChallenge ?? mongoose.model("OtpChallenge", otpChallengeSchema);
