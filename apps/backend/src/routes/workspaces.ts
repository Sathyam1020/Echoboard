import { and, db, eq } from "@workspace/db/client"
import { board, workspace } from "@workspace/db/schema"
import { Router, type Request, type Response } from "express"
import { z } from "zod"

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
  const code = (err as { code?: string }).code
  if (code === "23505") return true
  return /duplicate key|unique constraint/i.test(err.message)
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

    const [row] = await db
      .select()
      .from(workspace)
      .where(eq(workspace.id, id))

    res.status(201).json({ workspace: row })
  },
)

workspacesRouter.get(
  "/me",
  requireAuth,
  async (_req: Request, res: Response) => {
    const session = res.locals.session!
    const rows = await db
      .select()
      .from(workspace)
      .where(eq(workspace.ownerId, session.user.id))
      .orderBy(workspace.createdAt)

    res.json({ workspaces: rows })
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
    if (ws.ownerId !== session.user.id) {
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
