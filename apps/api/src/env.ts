import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const currentDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(currentDir, "../.env") });
dotenv.config({ path: resolve(currentDir, "../../../.env") });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(12).default("dev-secret-change-me"),
  UPLOAD_DIR: z.string().default("uploads"),
  TELEGRAM_BOT_TOKEN: z.string().optional().or(z.literal("")),
  ENABLE_TELEGRAM_POLLING: z
    .string()
    .default("false")
    .transform((value) => value === "true"),
  API_PUBLIC_URL: z.string().optional().or(z.literal(""))
});

export const env = envSchema.parse(process.env);
