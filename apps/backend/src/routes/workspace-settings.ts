import { randomBytes } from "node:crypto"

import { and, db, eq } from "@workspace/db/client"
import { board, workspace } from "@workspace/db/schema"
import { Router, type Request, type Response } from "express"
import { z } from "zod"

import {
  assertCanMutateWorkspace,
  getActiveWorkspace,
  requireWorkspaceMember,
} from "../lib/workspace-context.js"
import { AppError } from "../middleware/error-handler.js"
import { requireAuth } from "../middleware/require-auth.js"

export const workspaceSettingsRouter: Router = Router()

// Resolves the workspace the admin is currently acting on (active_workspace_id
// cookie + workspace_member). Replaces the old "first owned workspace" lookup
// so members of multiple workspaces hit the right one.
async function loadActiveAdminWorkspace(req: Request) {
  const ctx = await getActiveWorkspace(req)
  if (!ctx) {
    throw new AppError("No workspace found for this user", {
      status: 404,
      code: "WORKSPACE_NOT_FOUND",
    })
  }
  const [ws] = await db
    .select()
    .from(workspace)
    .where(eq(workspace.id, ctx.workspace.id))
  if (!ws) {
    throw new AppError("Workspace not found", {
      status: 404,
      code: "WORKSPACE_NOT_FOUND",
    })
  }
  return ws
}

function serializeSettings(ws: typeof workspace.$inferSelect) {
  return {
    id: ws.id,
    name: ws.name,
    slug: ws.slug,
    publicBoardAuth: ws.publicBoardAuth,
    requireSignedIdentify: ws.requireSignedIdentify,
    identifySecretKey: ws.identifySecretKey,
    ssoRedirectUrl: ws.ssoRedirectUrl,
  }
}

workspaceSettingsRouter.get(
  "/",
  requireAuth,
  requireWorkspaceMember(),
  async (req: Request, res: Response) => {
    const ws = await loadActiveAdminWorkspace(req)
    res.json({ settings: serializeSettings(ws) })
  },
)

const updateSettingsBody = z
  .object({
    publicBoardAuth: z.enum(["guest", "oauth", "sso"]).optional(),
    requireSignedIdentify: z.boolean().optional(),
    ssoRedirectUrl: z.string().url().optional().nullable(),
  })
  .refine(
    (v) =>
      v.publicBoardAuth !== undefined ||
      v.requireSignedIdentify !== undefined ||
      v.ssoRedirectUrl !== undefined,
    { message: "Provide at least one field" },
  )

workspaceSettingsRouter.patch(
  "/",
  requireAuth,
  requireWorkspaceMember("admin"),
  async (req: Request, res: Response) => {
    const parsed = updateSettingsBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid input",
        { status: 400, code: "VALIDATION_ERROR" },
      )
    }
    const ws = await loadActiveAdminWorkspace(req)

    const patch: Record<string, unknown> = {}
    if (parsed.data.publicBoardAuth !== undefined)
      patch.publicBoardAuth = parsed.data.publicBoardAuth
    if (parsed.data.requireSignedIdentify !== undefined)
      patch.requireSignedIdentify = parsed.data.requireSignedIdentify
    if (parsed.data.ssoRedirectUrl !== undefined)
      patch.ssoRedirectUrl = parsed.data.ssoRedirectUrl

    const [updated] = await db
      .update(workspace)
      .set(patch)
      .where(eq(workspace.id, ws.id))
      .returning()
    res.json({ settings: serializeSettings(updated!) })
  },
)

workspaceSettingsRouter.post(
  "/regenerate-identify-key",
  requireAuth,
  requireWorkspaceMember("admin"),
  async (req: Request, res: Response) => {
    const ws = await loadActiveAdminWorkspace(req)
    const newKey = randomBytes(32).toString("hex")
    const [updated] = await db
      .update(workspace)
      .set({ identifySecretKey: newKey })
      .where(eq(workspace.id, ws.id))
      .returning()
    res.json({ settings: serializeSettings(updated!) })
  },
)

// ── Widget config ──────────────────────────────────────────────
// Per-board, since each board can have its own widget. Public GET (CORS *)
// is consumed by the widget loader on host SaaS sites; admin PATCH stays
// on the standard CORS allowlist.

export const widgetConfigPublicRouter: Router = Router()

widgetConfigPublicRouter.get(
  "/:boardId/config",
  async (req: Request, res: Response) => {
    const boardId = req.params.boardId
    if (typeof boardId !== "string" || !boardId) {
      throw new AppError("Invalid board id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }
    const [row] = await db
      .select({
        board: board,
        workspace: workspace,
      })
      .from(board)
      .innerJoin(workspace, eq(board.workspaceId, workspace.id))
      .where(eq(board.id, boardId))
    if (!row) {
      throw new AppError("Board not found", {
        status: 404,
        code: "BOARD_NOT_FOUND",
      })
    }
    res.json({
      boardId: row.board.id,
      boardSlug: row.board.slug,
      boardName: row.board.name,
      workspaceId: row.workspace.id,
      workspaceSlug: row.workspace.slug,
      workspaceName: row.workspace.name,
      requireSignedIdentify: row.workspace.requireSignedIdentify,
      color: row.board.widgetColor,
      position: row.board.widgetPosition,
      buttonText: row.board.widgetButtonText,
      showBranding: row.board.widgetShowBranding,
    })
  },
)

const widgetConfigBody = z
  .object({
    color: z.string().regex(/^#?[0-9a-fA-F]{6}$/).nullable().optional(),
    position: z.enum(["bottom-right", "bottom-left"]).optional(),
    buttonText: z.string().trim().min(1).max(24).optional(),
    showBranding: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.color !== undefined ||
      v.position !== undefined ||
      v.buttonText !== undefined ||
      v.showBranding !== undefined,
    { message: "Provide at least one field" },
  )

export const widgetConfigAdminRouter: Router = Router()

widgetConfigAdminRouter.patch(
  "/:boardId/widget-config",
  requireAuth,
  async (req: Request, res: Response) => {
    const boardId = req.params.boardId
    if (typeof boardId !== "string" || !boardId) {
      throw new AppError("Invalid board id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }
    const parsed = widgetConfigBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid input",
        { status: 400, code: "VALIDATION_ERROR" },
      )
    }
    const session = res.locals.session!
    const [row] = await db
      .select({
        board: board,
        workspaceId: workspace.id,
      })
      .from(board)
      .innerJoin(workspace, eq(board.workspaceId, workspace.id))
      .where(eq(board.id, boardId))
    if (!row) {
      throw new AppError("Board not found", {
        status: 404,
        code: "BOARD_NOT_FOUND",
      })
    }
    await assertCanMutateWorkspace(session.user.id, row.workspaceId)

    const patch: Record<string, unknown> = {}
    if (parsed.data.color !== undefined) {
      // Normalise: always store with leading '#'.
      patch.widgetColor =
        parsed.data.color === null
          ? null
          : parsed.data.color.startsWith("#")
            ? parsed.data.color
            : `#${parsed.data.color}`
    }
    if (parsed.data.position !== undefined)
      patch.widgetPosition = parsed.data.position
    if (parsed.data.buttonText !== undefined)
      patch.widgetButtonText = parsed.data.buttonText
    if (parsed.data.showBranding !== undefined)
      patch.widgetShowBranding = parsed.data.showBranding

    const [updated] = await db
      .update(board)
      .set(patch)
      .where(and(eq(board.id, boardId), eq(board.workspaceId, row.board.workspaceId)))
      .returning()
    res.json({
      board: {
        id: updated!.id,
        widgetColor: updated!.widgetColor,
        widgetPosition: updated!.widgetPosition,
        widgetButtonText: updated!.widgetButtonText,
        widgetShowBranding: updated!.widgetShowBranding,
      },
    })
  },
)
