import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env");
dotenv.config({ path: envPath, override: true });

function clean(value: string | undefined) {
  return (value ?? "").trim().replace(/^["']|["']$/g, "");
}

function smtpPass(value: string | undefined) {
  return clean(value).replace(/\s+/g, "");
}

export function smtpConfig() {
  dotenv.config({ path: envPath, override: true });
  const user = clean(process.env.SMTP_USER);
  return {
    host: clean(process.env.SMTP_HOST),
    port: Number(clean(process.env.SMTP_PORT) || "587"),
    user,
    pass: smtpPass(process.env.SMTP_PASS),
    from: clean(process.env.SMTP_FROM) || user,
  };
}

export const env = {
  port: Number(process.env.PORT ?? 5000),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  mongodbUri: process.env.MONGODB_URI ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "velmora-jwt-change-me",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  get smtp() {
    return smtpConfig();
  },
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

export function hasSmtp() {
  const smtp = smtpConfig();
  return Boolean(smtp.host && smtp.user && smtp.pass);
}
