import { randomBytes, randomUUID } from "node:crypto"

import { and, db, eq, gt } from "@workspace/db/client"
import { visitor, visitorSession } from "@workspace/db/schema"

export type VisitorRow = typeof visitor.$inferSelect

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export const VISITOR_COOKIE_NAME = "eb_visitor_token"

export type VisitorAuthMethod =
  | "guest"
  | "identify"
  | "secure_identify"
  | "oauth_google"
  | "sso"
  | "echoboard_user"

export async function createVisitorSession(
  visitorId: string,
  ttlDays: number,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + ttlDays * DAY_MS)
  await db.insert(visitorSession).values({
    id: randomUUID(),
    visitorId,
    token,
    expiresAt,
  })
  return { token, expiresAt }
}

// Single hop: validate token + load visitor row. Filters on expiresAt so
// stale sessions never leak through.
export async function loadVisitorBySession(
  token: string,
): Promise<{ visitor: VisitorRow; expiresAt: Date } | null> {
  const [row] = await db
    .select({
      visitor,
      expiresAt: visitorSession.expiresAt,
    })
    .from(visitorSession)
    .innerJoin(visitor, eq(visitorSession.visitorId, visitor.id))
    .where(
      and(
        eq(visitorSession.token, token),
        gt(visitorSession.expiresAt, new Date()),
      ),
    )
  return row ?? null
}

export async function deleteVisitorSession(token: string): Promise<void> {
  await db.delete(visitorSession).where(eq(visitorSession.token, token))
}

export type FindOrCreateVisitorInput = {
  workspaceId: string
  externalId?: string | null
  email?: string | null
  name?: string | null
  avatarUrl?: string | null
  metadata?: Record<string, unknown> | null
  authMethod: VisitorAuthMethod
  hmacVerified?: boolean
}

// Find-or-create with merge. Prefers externalId match (most stable from host
// app); falls back to email; otherwise creates a new visitor.
export async function findOrCreateVisitor(
  input: FindOrCreateVisitorInput,
): Promise<VisitorRow> {
  let existing: VisitorRow | undefined

  if (input.externalId) {
    const [r] = await db
      .select()
      .from(visitor)
      .where(
        and(
          eq(visitor.workspaceId, input.workspaceId),
          eq(visitor.externalId, input.externalId),
        ),
      )
    existing = r
  }
  if (!existing && input.email) {
    const [r] = await db
      .select()
      .from(visitor)
      .where(
        and(
          eq(visitor.workspaceId, input.workspaceId),
          eq(visitor.email, input.email),
        ),
      )
    existing = r
  }

  if (existing) {
    const updates: Record<string, unknown> = { lastSeenAt: new Date() }
    if (input.externalId && !existing.externalId)
      updates.externalId = input.externalId
    if (input.email && !existing.email) updates.email = input.email
    if (input.name && input.name !== existing.name) updates.name = input.name
    if (input.avatarUrl && input.avatarUrl !== existing.avatarUrl)
      updates.avatarUrl = input.avatarUrl
    if (input.metadata) {
      const current =
        (existing.metadata as Record<string, unknown> | null) ?? {}
      updates.metadata = { ...current, ...input.metadata }
    }
    if (input.hmacVerified) updates.hmacVerified = true

    const [updated] = await db
      .update(visitor)
      .set(updates)
      .where(eq(visitor.id, existing.id))
      .returning()
    return updated!
  }

  const [created] = await db
    .insert(visitor)
    .values({
      id: randomUUID(),
      workspaceId: input.workspaceId,
      externalId: input.externalId ?? null,
      email: input.email ?? null,
      name: input.name ?? null,
      avatarUrl: input.avatarUrl ?? null,
      metadata: input.metadata ?? {},
      authMethod: input.authMethod,
      hmacVerified: input.hmacVerified ?? false,
    })
    .returning()
  return created!
}

export function visitorCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  }
}

export function serializeVisitor(v: VisitorRow) {
  return {
    id: v.id,
    workspaceId: v.workspaceId,
    name: v.name,
    email: v.email,
    avatarUrl: v.avatarUrl,
    authMethod: v.authMethod,
  }
}
