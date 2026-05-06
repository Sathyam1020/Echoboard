import { and, db, desc, eq, sql } from "@workspace/db/client"
import { board, post, user, visitor, workspace } from "@workspace/db/schema"
import { Router, type Request, type Response } from "express"

import {
  decodeCursor,
  isPostsCursor,
  parseSearch,
  parseSort,
} from "../lib/cursor.js"
import { requireWorkspaceMember } from "../lib/workspace-context.js"
import { AppError } from "../middleware/error-handler.js"
import { requireAuth } from "../middleware/require-auth.js"

import {
  paginatePosts,
  readOptionalActor,
  type BoardFilter,
} from "./boards.js"

export const dashboardRouter: Router = Router()

// Whitelist of post statuses the admin filter accepts. Mirrors the
// status enum used by the post status update endpoint.
const STATUSES = new Set(["review", "planned", "progress", "shipped"])

dashboardRouter.get(
  "/boards",
  requireAuth,
  requireWorkspaceMember(),
  async (_req: Request, res: Response) => {
    const ctx = res.locals.workspaceContext!

    const rows = await db
      .select({
        boardId: board.id,
        boardName: board.name,
        boardSlug: board.slug,
        boardVisibility: board.visibility,
        workspaceSlug: workspace.slug,
        workspaceName: workspace.name,
        postCount: sql<number>`cast(count(${post.id}) as int)`,
        createdAt: board.createdAt,
      })
      .from(board)
      .innerJoin(workspace, eq(board.workspaceId, workspace.id))
      .leftJoin(post, eq(post.boardId, board.id))
      .where(eq(workspace.id, ctx.workspace.id))
      .groupBy(board.id, workspace.id)
      .orderBy(desc(board.createdAt))

    res.json({ boards: rows })
  },
)

dashboardRouter.get(
  "/recent-posts",
  requireAuth,
  requireWorkspaceMember(),
  async (_req: Request, res: Response) => {
    const ctx = res.locals.workspaceContext!

    const rows = await db
      .select({
        id: post.id,
        title: post.title,
        description: post.description,
        status: post.status,
        createdAt: post.createdAt,
        // COALESCE both joins so visitor-authored posts surface a name
        // here too (previously they showed up nameless).
        authorName: sql<string | null>`COALESCE(${user.name}, ${visitor.name})`,
        authorId: sql<string | null>`COALESCE(${user.id}, ${visitor.id})`,
        boardName: board.name,
        boardSlug: board.slug,
        workspaceSlug: workspace.slug,
      })
      .from(post)
      .innerJoin(board, eq(post.boardId, board.id))
      .innerJoin(workspace, eq(board.workspaceId, workspace.id))
      .leftJoin(user, eq(post.authorId, user.id))
      .leftJoin(visitor, eq(post.visitorId, visitor.id))
      .where(eq(workspace.id, ctx.workspace.id))
      .orderBy(desc(post.createdAt))
      .limit(5)

    res.json({ posts: rows })
  },
)

// GET /api/dashboard/feedback?boardId=&status=&cursor=&sort=&search= —
// admin all-feedback inbox. Filterable by status (across every board)
// and/or boardId (any board in the active workspace, including private
// ones). Reuses paginatePosts for cursor + sort + search + pinned-first
// + vote enrichment.
dashboardRouter.get(
  "/feedback",
  requireAuth,
  requireWorkspaceMember(),
  async (req: Request, res: Response) => {
    const ctx = res.locals.workspaceContext!

    const boardIdRaw = typeof req.query.boardId === "string" ? req.query.boardId : null
    const statusRaw = typeof req.query.status === "string" ? req.query.status : null

    if (statusRaw && !STATUSES.has(statusRaw)) {
      throw new AppError("Invalid status", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }
    const status = statusRaw && STATUSES.has(statusRaw) ? statusRaw : null

    let scope: BoardFilter
    if (boardIdRaw) {
      const [b] = await db
        .select()
        .from(board)
        .where(
          and(eq(board.id, boardIdRaw), eq(board.workspaceId, ctx.workspace.id)),
        )
      if (!b) {
        throw new AppError("Board not found", {
          status: 404,
          code: "BOARD_NOT_FOUND",
        })
      }
      scope = { kind: "single", boardId: b.id }
    } else {
      scope = { kind: "workspace-admin", workspaceId: ctx.workspace.id }
    }

    const cursor = decodeCursor(
      typeof req.query.cursor === "string" ? req.query.cursor : null,
      isPostsCursor,
    )
    const sort = parseSort(req.query.sort)
    const search = parseSearch(req.query.search)

    const result = await paginatePosts({
      boardFilter: scope,
      cursor,
      sort,
      search,
      includePinned: cursor === null,
      includeBoardOnPost: true,
      status: status ?? undefined,
      actor: await readOptionalActor(req),
    })

    res.json(result)
  },
)
