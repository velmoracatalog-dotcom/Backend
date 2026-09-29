import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    picture: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true },
);

export const User = mongoose.models.User ?? mongoose.model("User", userSchema);
