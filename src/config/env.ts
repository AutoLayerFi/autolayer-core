import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  DB_PASSWORD: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_NAME: z.string().min(1),

  SESSION_TTL_SECONDS: z.coerce.number().default(300),
  DEFAULT_ASSET: z.string().default("XLM"),
  DEFAULT_NETWORK: z.string().default("testnet"),
});

export const env = envSchema.parse(process.env);
