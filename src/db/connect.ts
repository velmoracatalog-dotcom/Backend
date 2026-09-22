import mongoose from "mongoose";
import { env } from "../config/env.js";

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseConnect?: Promise<typeof mongoose>;
};

export async function connectDb() {
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is not set");
  }

  if (mongoose.connection.readyState === 1) return mongoose;

  if (!globalForMongoose.mongooseConnect) {
    globalForMongoose.mongooseConnect = mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 10000,
    });
  }

  return globalForMongoose.mongooseConnect;
}
