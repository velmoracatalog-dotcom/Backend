import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 5000),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  mongodbUri: process.env.MONGODB_URI ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "velmora-jwt-change-me",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  isProd: process.env.NODE_ENV === "production",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  },
};

export function hasCloudinary() {
  return Boolean(
    env.cloudinary.cloudName &&
      env.cloudinary.apiKey &&
      env.cloudinary.apiSecret,
  );
}
