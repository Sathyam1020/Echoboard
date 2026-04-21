import "dotenv/config"

// Soft env reader — no validation here. Each consumer (backend server, Next.js)
// is expected to validate required values at startup in its own config. Keeping
// this tolerant lets tooling (better-auth CLI, drizzle-kit) import the auth
// server config without a live environment.

export const authEnv = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "",
  BETTER_AUTH_URL:
    process.env.BETTER_AUTH_URL ?? "http://localhost:4000",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
} as const

export const googleEnabled = Boolean(
  authEnv.GOOGLE_CLIENT_ID && authEnv.GOOGLE_CLIENT_SECRET,
)

export const trustedOrigins = authEnv.CORS_ORIGIN
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
