import { config as loadDotenv } from "dotenv"
import { z } from "zod"

if (process.env.NODE_ENV !== "production") {
  loadDotenv()
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:3000"),

  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Public URL of the web app — used to build accept-invite links.
  APP_URL: z.string().url().default("http://localhost:3000"),

  // HMAC secret for workspace invite tokens.
  WORKSPACE_INVITE_SECRET: z
    .string()
    .min(32, "WORKSPACE_INVITE_SECRET must be at least 32 characters"),

  // Resend transactional email. API key is optional in dev — when missing,
  // emails are logged to stderr instead of sent.
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().default("onboarding@example.com"),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  )
  process.exit(1)
}

export const env = Object.freeze(parsed.data)
export type Env = typeof env
