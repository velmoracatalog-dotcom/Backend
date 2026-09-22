import { v2 as cloudinary } from "cloudinary";
import { env, hasCloudinary } from "../config/env.js";

export function configureCloudinary() {
  if (!hasCloudinary()) return false;
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
  return true;
}

export async function uploadBuffer(buffer: Buffer, folder = "velmora") {
  if (!configureCloudinary()) {
    throw new Error("Cloudinary credentials are missing");
  }

  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "image" }, (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      })
      .end(buffer);
  });
}
