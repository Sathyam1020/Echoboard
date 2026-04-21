import "dotenv/config"
import { defineConfig } from "drizzle-kit"

// `drizzle-kit generate` only diffs schema files to produce SQL — it does not
// need a live DATABASE_URL. `drizzle-kit migrate`, `push`, and `studio` do.
// Keep a placeholder so the config file is always importable; migrate-time
// commands fail loudly when the URL is actually missing.
const url =
  process.env.DATABASE_URL ?? "postgres://noop:noop@localhost:5432/noop"

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  verbose: true,
  strict: true,
})
