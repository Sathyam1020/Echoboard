// Re-export every table + relation from the generated auth schema.
// Better Auth CLI rewrites `auth-schema.ts` on regeneration; this barrel is the
// stable import path for consumers (`@workspace/db/schema`).
export * from "./auth-schema.js"
export * from "./app-schema.js"
