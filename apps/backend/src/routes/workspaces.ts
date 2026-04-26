import { randomUUID } from "node:crypto"

import { and, db, desc, eq } from "@workspace/db/client"
import { board, workspace, workspaceMember } from "@workspace/db/schema"
import { Router, type Request, type Response } from "express"
import { z } from "zod"

import { setActiveWorkspaceCookie } from "../lib/workspace-context.js"
import { AppError } from "../middleware/error-handler.js"
import { requireAuth } from "../middleware/require-auth.js"

export const workspacesRouter: Router = Router()

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

// Next.js app routes + API prefixes that would collide with path-based
// workspace URLs (echoboard.io/{slug}/*). Kept in sync with app/ structure.
const RESERVED_SLUGS = new Set([
  "api",
  "admin",
  "dashboard",
  "signin",
  "signup",
  "onboarding",
  "settings",
  "account",
  "_next",
  "static",
  "public",
  "favicon.ico",
])

const createWorkspaceBody = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(40)
    .regex(SLUG_REGEX, "Slug may contain only lowercase letters, numbers, and hyphens"),
})

const createBoardBody = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().toLowerCase().min(2).max(40).regex(SLUG_REGEX),
  visibility: z.enum(["public", "private"]).default("public"),
})

function isUniqueViolation(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  // Drizzle wraps the underlying NeonDbError as `cause`, and only the
  // inner error reliably carries `code: '23505'`. Walk the chain so we
  // match whether the consumer caught the raw driver error or the
  // wrapped DrizzleQueryError.
  let cur: unknown = err
  while (cur instanceof Error) {
    const code = (cur as { code?: string }).code
    if (code === "23505") return true
    if (/duplicate key|unique constraint/i.test(cur.message)) return true
    cur = (cur as { cause?: unknown }).cause
  }
  return false
}

workspacesRouter.post(
  "/",
  requireAuth,
  async (req: Request, res: Response) => {
    const parsed = createWorkspaceBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    if (RESERVED_SLUGS.has(parsed.data.slug)) {
      throw new AppError("That URL is reserved — try another", {
        status: 409,
        code: "SLUG_RESERVED",
      })
    }

    const session = res.locals.session!
    const id = crypto.randomUUID()

    // Neon HTTP driver doesn't support transactions, so we run the two
    // inserts sequentially with a compensating delete on failure of the
    // second one. The compensation keeps us out of the "orphan workspace
    // the creator can't access" state.
    try {
      await db.insert(workspace).values({
        id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        ownerId: session.user.id,
      })
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError("That URL is taken — try another", {
          status: 409,
          code: "WORKSPACE_SLUG_TAKEN",
        })
      }
      throw err
    }

    try {
      await db.insert(workspaceMember).values({
        id: randomUUID(),
        workspaceId: id,
        userId: session.user.id,
        role: "owner",
        addedByUserId: session.user.id,
      })
    } catch (memberErr) {
      // Best-effort cleanup so the slug isn't permanently consumed.
      // If this delete itself fails we just log and rethrow — the
      // outer error matters more than the cleanup.
      try {
        await db.delete(workspace).where(eq(workspace.id, id))
      } catch {
        // intentionally swallowed — see comment above
      }
      throw memberErr
    }

    const [row] = await db
      .select()
      .from(workspace)
      .where(eq(workspace.id, id))

    setActiveWorkspaceCookie(res, id)
    res.status(201).json({ workspace: row })
  },
)

workspacesRouter.get(
  "/me",
  requireAuth,
  async (_req: Request, res: Response) => {
    const session = res.locals.session!
    // Read every workspace this user is a member of (any role). The legacy
    // single-owner relation is migrated into workspace_member, so this query
    // covers both pre-existing solo workspaces and newly invited memberships.
    const rows = await db
      .select({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        ownerId: workspace.ownerId,
        logoUrl: workspace.logoUrl,
        publicBoardAuth: workspace.publicBoardAuth,
        identifySecretKey: workspace.identifySecretKey,
        requireSignedIdentify: workspace.requireSignedIdentify,
        ssoRedirectUrl: workspace.ssoRedirectUrl,
        ssoSharedSecret: workspace.ssoSharedSecret,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
        role: workspaceMember.role,
        joinedAt: workspaceMember.createdAt,
      })
      .from(workspaceMember)
      .innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId))
      .where(eq(workspaceMember.userId, session.user.id))
      .orderBy(desc(workspaceMember.createdAt))

    res.json({ workspaces: rows })
  },
)

// Activate a workspace — sets the active_workspace_id cookie that scopes
// every subsequent dashboard request. Membership is verified server-side
// before the cookie is set.
workspacesRouter.post(
  "/:workspaceId/activate",
  requireAuth,
  async (req: Request, res: Response) => {
    const session = res.locals.session!
    const workspaceId = req.params.workspaceId
    if (typeof workspaceId !== "string" || !workspaceId) {
      throw new AppError("Invalid workspace id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }
    const [row] = await db
      .select({
        id: workspace.id,
        slug: workspace.slug,
        name: workspace.name,
        role: workspaceMember.role,
      })
      .from(workspaceMember)
      .innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId))
      .where(
        and(
          eq(workspaceMember.userId, session.user.id),
          eq(workspaceMember.workspaceId, workspaceId),
        ),
      )
    if (!row) {
      throw new AppError("Not a workspace member", {
        status: 403,
        code: "FORBIDDEN",
      })
    }
    setActiveWorkspaceCookie(res, workspaceId)
    res.json({
      workspace: { id: row.id, slug: row.slug, name: row.name, role: row.role },
    })
  },
)

workspacesRouter.post(
  "/:workspaceId/boards",
  requireAuth,
  async (req: Request, res: Response) => {
    const parsed = createBoardBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    if (parsed.data.visibility !== "public") {
      throw new AppError("Private boards aren't available yet", {
        status: 400,
        code: "VISIBILITY_NOT_SUPPORTED",
      })
    }

    const session = res.locals.session!
    const workspaceId = req.params.workspaceId
    if (typeof workspaceId !== "string" || !workspaceId) {
      throw new AppError("Invalid workspace id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const [ws] = await db
      .select()
      .from(workspace)
      .where(eq(workspace.id, workspaceId))

    if (!ws) {
      throw new AppError("Workspace not found", {
        status: 404,
        code: "WORKSPACE_NOT_FOUND",
      })
    }
    // Any admin+ can create boards. Member-level can read but not mutate.
    const [membership] = await db
      .select({ role: workspaceMember.role })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.userId, session.user.id),
          eq(workspaceMember.workspaceId, ws.id),
        ),
      )
    if (
      !membership ||
      (membership.role !== "owner" && membership.role !== "admin")
    ) {
      throw new AppError("Not authorized to create boards in this workspace", {
        status: 403,
        code: "FORBIDDEN",
      })
    }

    const id = crypto.randomUUID()

    try {
      await db.insert(board).values({
        id,
        workspaceId: ws.id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        visibility: "public",
      })
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError("That board URL is taken in this workspace", {
          status: 409,
          code: "BOARD_SLUG_TAKEN",
        })
      }
      throw err
    }

    const [row] = await db
      .select()
      .from(board)
      .where(and(eq(board.id, id), eq(board.workspaceId, ws.id)))

    res.status(201).json({ board: row, workspaceSlug: ws.slug })
  },
)
