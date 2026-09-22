import mongoose from "mongoose";
import { env } from "../config/env.js";

export async function connectDb() {
  if (!env.mongodbUri) {
    throw new Error("Add your MongoDB URI to backend/.env as MONGODB_URI");
  }
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(env.mongodbUri);
}
