// One-off DB inspector. Prints what tables exist and which drizzle migrations
// are recorded as applied. Run from `packages/db/`:
//   node scripts/diagnose.mjs

import "dotenv/config"
import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL is not set in packages/db/.env")
  process.exit(1)
}

const sql = neon(url)

try {
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `
  console.log("Public tables:")
  for (const t of tables) console.log("  -", t.table_name)

  let migrations = []
  try {
    migrations = await sql`
      SELECT hash, created_at
      FROM drizzle.__drizzle_migrations
      ORDER BY id
    `
  } catch (err) {
    console.log("\nDrizzle migrations table:")
    console.log("  (not found — has drizzle-kit never run successfully?)")
    console.log("  err:", err.message)
  }

  if (migrations.length > 0) {
    console.log("\nRecorded drizzle migrations:")
    for (const m of migrations) {
      console.log("  -", m.hash.slice(0, 12), "@", m.created_at)
    }
  }
} catch (err) {
  console.error("DB inspection failed:", err.message)
  process.exit(1)
}
