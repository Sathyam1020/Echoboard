import "dotenv/config"

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

// Re-export the helpers consumers need so every workspace uses the same
// drizzle-orm instance. Importing these from `drizzle-orm` directly in
// `apps/*` risks npm hoisting a second copy, which tsc surfaces as
// `shouldInlineParams` type-incompatibility errors at FK comparison sites.
export { sql, eq, and, or, desc, asc, ne, gt, lt, gte, lte, isNull, isNotNull, inArray, not, like } from "drizzle-orm"

// `neon()` is lazy — it returns a query function that opens a connection on
// first use, not at construction. Keeping a placeholder URL here lets tooling
// like `better-auth generate` and `drizzle-kit` import this module without a
// live database. Actual queries still fail loudly if `DATABASE_URL` is unset.
const url =
  process.env.DATABASE_URL ?? "postgres://noop:noop@localhost:5432/noop"

const sql = neon(url)

export const db = drizzle({ client: sql })
export type Db = typeof db
