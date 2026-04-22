// Fallback migrator that uses the neon-http driver to apply pending migration
// SQL files directly. Surfaces SQL errors (drizzle-kit's pg driver sometimes
// exits code 1 without printing the underlying error).
//
// Usage from `packages/db/`:
//   node scripts/migrate-http.mjs
//
// Keeps the drizzle-kit journal (`drizzle/meta/_journal.json`) as the source of
// truth for which migrations exist, and the `drizzle.__drizzle_migrations`
// table for which have been applied. Only applies files whose hash isn't
// already recorded.

import "dotenv/config"
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL is not set in packages/db/.env")
  process.exit(1)
}

const sql = neon(url)

// Read the journal to find pending migrations.
const journalRaw = await readFile(join("drizzle", "meta", "_journal.json"), "utf8")
const journal = JSON.parse(journalRaw)

// Ensure the migrations bookkeeping schema + table exist.
await sql`CREATE SCHEMA IF NOT EXISTS "drizzle"`
await sql`
  CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
  )
`

const appliedRows = await sql`
  SELECT hash FROM drizzle.__drizzle_migrations
`
const applied = new Set(appliedRows.map((r) => r.hash))

for (const entry of journal.entries) {
  const path = join("drizzle", `${entry.tag}.sql`)
  const body = await readFile(path, "utf8")

  // Drizzle uses the SHA-256 of the SQL text as the "hash" in its migrations
  // table. Match that scheme so reruns of either drizzle-kit or this script
  // recognize each other's state.
  const hash = createHash("sha256").update(body).digest("hex")

  if (applied.has(hash)) {
    console.log(`✓ already applied: ${entry.tag}`)
    continue
  }

  console.log(`→ applying: ${entry.tag}`)

  const statements = body
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const stmt of statements) {
    try {
      // neon-http doesn't accept raw SQL via the template tag; use the fn form.
      await sql.query(stmt)
    } catch (err) {
      // Tolerate "already exists" errors so reruns after a partial apply
      // (which happens when drizzle-kit's pg driver half-runs and exits)
      // complete the remaining work instead of halting.
      // 42P07 = duplicate_table / duplicate_index, 42710 = duplicate_object (constraint)
      const alreadyExists =
        /already exists/i.test(err.message) ||
        err.code === "42P07" ||
        err.code === "42710"

      if (alreadyExists) {
        console.log(`  ↷ skip (already exists): ${stmt.split("\n")[0].slice(0, 80)}…`)
        continue
      }

      console.error(`✗ statement failed in ${entry.tag}:`)
      console.error(`  ${stmt.split("\n")[0].slice(0, 120)}…`)
      console.error(`  ${err.message}`)
      process.exit(1)
    }
  }

  await sql`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES (${hash}, ${entry.when})
  `
  console.log(`✓ applied: ${entry.tag}`)
}

console.log("\nDone.")
