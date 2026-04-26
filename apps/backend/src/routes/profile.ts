import {
  and,
  db,
  desc,
  eq,
  isNull,
  lt,
  or,
  sql,
} from "@workspace/db/client"
import {
  board,
  comment,
  post,
  user,
  visitor,
  workspace,
} from "@workspace/db/schema"
import { Router, type Request, type Response } from "express"

import {
  decodeCursor,
  encodeCursor,
  isCommentsCursor,
  isPostsCursor,
  PAGE_SIZE,
  parseSort,
} from "../lib/cursor.js"
import { AppError } from "../middleware/error-handler.js"
import { paginatePosts, readOptionalActor } from "./boards.js"

export const profileRouter: Router = Router()

// Resolve a profile actor by id. Tries the user table first, then falls
// back to visitor (which is workspace-scoped — visitors only exist in
// the context of one workspace). Email is never selected here.
type ResolvedActor = {
  kind: "user" | "visitor"
  id: string
  name: string
  image: string | null
  memberSince: Date
}

async function resolveActor(
  workspaceId: string,
  actorId: string,
): Promise<ResolvedActor | null> {
  const [u] = await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, actorId))

  if (u) {
    return {
      kind: "user",
      id: u.id,
      name: u.name,
      image: u.image ?? null,
      memberSince: u.createdAt,
    }
  }

  const [v] = await db
    .select({
      id: visitor.id,
      name: visitor.name,
      avatarUrl: visitor.avatarUrl,
      createdAt: visitor.createdAt,
    })
    .from(visitor)
    .where(and(eq(visitor.id, actorId), eq(visitor.workspaceId, workspaceId)))

  if (v) {
    return {
      kind: "visitor",
      id: v.id,
      // Visitors *should* always have a name (gathered via IdentityModal),
      // but guard with a fallback so the type is total.
      name: v.name ?? "Guest",
      image: v.avatarUrl ?? null,
      memberSince: v.createdAt,
    }
  }

  return null
}

async function loadWorkspaceBySlug(slug: string) {
  const [ws] = await db
    .select()
    .from(workspace)
    .where(eq(workspace.slug, slug))
  if (!ws) {
    throw new AppError("Workspace not found", {
      status: 404,
      code: "WORKSPACE_NOT_FOUND",
    })
  }
  return ws
}

// GET /api/workspaces/:workspaceSlug/profile/:actorId
// Header data + counts + product impact + 12-week activity heatmap.
profileRouter.get(
  "/:workspaceSlug/profile/:actorId",
  async (req: Request, res: Response) => {
    const { workspaceSlug, actorId } = req.params
    if (
      typeof workspaceSlug !== "string" ||
      !workspaceSlug ||
      typeof actorId !== "string" ||
      !actorId
    ) {
      throw new AppError("Invalid params", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const ws = await loadWorkspaceBySlug(workspaceSlug)
    const actor = await resolveActor(ws.id, actorId)
    if (!actor) {
      throw new AppError("Profile not found", {
        status: 404,
        code: "PROFILE_NOT_FOUND",
      })
    }

    // Activity threshold for the heatmap — 12 weeks back from now.
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const since = new Date(Date.now() - 12 * weekMs)

    // Fan out every count + the activity event stream in parallel.
    // Raw SQL uses literal table names (matches the existing pattern
    // in `boards.ts` for the latest-comment subquery). Embedding
    // Drizzle table refs (`${post}` etc.) inside `sql\`...\`` produces
    // broken queries when aliases are present.
    const [
      feedbackCountRows,
      shippedCountRows,
      commentCountRows,
      voteCountRows,
      votesReceivedRows,
      activityRows,
    ] = await Promise.all([
      db.execute(sql`
        SELECT COUNT(*)::int AS count
        FROM post p
        INNER JOIN board b ON b.id = p.board_id
        WHERE b.workspace_id = ${ws.id}
          AND b.visibility = 'public'
          AND p.merged_into_post_id IS NULL
          AND (p.author_id = ${actor.id} OR p.visitor_id = ${actor.id})
      `),
      db.execute(sql`
        SELECT COUNT(*)::int AS count
        FROM post p
        INNER JOIN board b ON b.id = p.board_id
        WHERE b.workspace_id = ${ws.id}
          AND b.visibility = 'public'
          AND p.merged_into_post_id IS NULL
          AND p.status = 'shipped'
          AND (p.author_id = ${actor.id} OR p.visitor_id = ${actor.id})
      `),
      db.execute(sql`
        SELECT COUNT(*)::int AS count
        FROM comment c
        INNER JOIN post p ON p.id = c.post_id
        INNER JOIN board b ON b.id = p.board_id
        WHERE b.workspace_id = ${ws.id}
          AND b.visibility = 'public'
          AND c.deleted_at IS NULL
          AND (c.author_id = ${actor.id} OR c.visitor_id = ${actor.id})
      `),
      db.execute(sql`
        SELECT COUNT(*)::int AS count
        FROM post_vote pv
        INNER JOIN post p ON p.id = pv.post_id
        INNER JOIN board b ON b.id = p.board_id
        WHERE b.workspace_id = ${ws.id}
          AND b.visibility = 'public'
          AND (pv.user_id = ${actor.id} OR pv.visitor_id = ${actor.id})
      `),
      db.execute(sql`
        SELECT COUNT(*)::int AS count
        FROM post_vote pv
        INNER JOIN post p ON p.id = pv.post_id
        INNER JOIN board b ON b.id = p.board_id
        WHERE b.workspace_id = ${ws.id}
          AND b.visibility = 'public'
          AND p.merged_into_post_id IS NULL
          AND (p.author_id = ${actor.id} OR p.visitor_id = ${actor.id})
      `),
      // UNION ALL over post + comment + vote creation timestamps in the
      // last 12 weeks. Bucketing happens in JS.
      db.execute(sql`
        SELECT p.created_at AS ts FROM post p
          INNER JOIN board b ON b.id = p.board_id
          WHERE b.workspace_id = ${ws.id}
            AND b.visibility = 'public'
            AND (p.author_id = ${actor.id} OR p.visitor_id = ${actor.id})
            AND p.created_at >= ${since}
        UNION ALL
        SELECT c.created_at AS ts FROM comment c
          INNER JOIN post p ON p.id = c.post_id
          INNER JOIN board b ON b.id = p.board_id
          WHERE b.workspace_id = ${ws.id}
            AND b.visibility = 'public'
            AND c.deleted_at IS NULL
            AND (c.author_id = ${actor.id} OR c.visitor_id = ${actor.id})
            AND c.created_at >= ${since}
        UNION ALL
        SELECT pv.created_at AS ts FROM post_vote pv
          INNER JOIN post p ON p.id = pv.post_id
          INNER JOIN board b ON b.id = p.board_id
          WHERE b.workspace_id = ${ws.id}
            AND b.visibility = 'public'
            AND (pv.user_id = ${actor.id} OR pv.visitor_id = ${actor.id})
            AND pv.created_at >= ${since}
      `),
    ])

    const feedbackCount =
      (feedbackCountRows.rows[0] as { count: number } | undefined)?.count ?? 0
    const shippedCount =
      (shippedCountRows.rows[0] as { count: number } | undefined)?.count ?? 0
    const commentCount =
      (commentCountRows.rows[0] as { count: number } | undefined)?.count ?? 0
    const voteCount =
      (voteCountRows.rows[0] as { count: number } | undefined)?.count ?? 0
    const votesReceived =
      (votesReceivedRows.rows[0] as { count: number } | undefined)?.count ?? 0

    // Bucket activity into the last 12 weeks. Index 0 = oldest week,
    // index 11 = current week (matches ProductActivityCard convention).
    const weeks = Array<number>(12).fill(0)
    const now = Date.now()
    for (const row of activityRows.rows as Array<{ ts: Date | string }>) {
      const t = row.ts instanceof Date ? row.ts.getTime() : new Date(row.ts).getTime()
      if (Number.isNaN(t)) continue
      const weeksAgo = Math.floor((now - t) / weekMs)
      if (weeksAgo >= 0 && weeksAgo < 12) {
        weeks[11 - weeksAgo]! += 1
      }
    }

    res.json({
      workspace: { id: ws.id, name: ws.name, slug: ws.slug },
      actor: {
        id: actor.id,
        name: actor.name,
        image: actor.image,
        kind: actor.kind,
        memberSince: actor.memberSince.toISOString(),
      },
      totals: { feedbackCount, commentCount, voteCount },
      impact: { shippedCount, votesReceived },
      activity: weeks,
    })
  },
)

// GET /api/workspaces/:workspaceSlug/profile/:actorId/feedback?cursor=&sort=
// Paginated posts authored by the actor across the workspace's public
// boards. Reuses paginatePosts via the new "actor" board filter variant.
profileRouter.get(
  "/:workspaceSlug/profile/:actorId/feedback",
  async (req: Request, res: Response) => {
    const { workspaceSlug, actorId } = req.params
    if (
      typeof workspaceSlug !== "string" ||
      !workspaceSlug ||
      typeof actorId !== "string" ||
      !actorId
    ) {
      throw new AppError("Invalid params", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const ws = await loadWorkspaceBySlug(workspaceSlug)
    const actor = await resolveActor(ws.id, actorId)
    if (!actor) {
      throw new AppError("Profile not found", {
        status: 404,
        code: "PROFILE_NOT_FOUND",
      })
    }

    const cursor = decodeCursor(
      typeof req.query.cursor === "string" ? req.query.cursor : null,
      isPostsCursor,
    )
    const sort = parseSort(req.query.sort)

    const result = await paginatePosts({
      boardFilter: { kind: "actor", workspaceId: ws.id, actorId: actor.id },
      cursor,
      sort,
      search: "",
      // Pinned posts on a profile feed don't really apply — the actor's
      // own posts shouldn't be re-ordered by an admin's pin status. Skip
      // pinned prepending.
      includePinned: false,
      includeBoardOnPost: true,
      actor: await readOptionalActor(req),
    })

    res.json(result)
  },
)

// GET /api/workspaces/:workspaceSlug/profile/:actorId/comments?cursor=
// Paginated comments authored by the actor — sorted newest first, each
// row includes its post + board context for the row's "on <post>" link.
profileRouter.get(
  "/:workspaceSlug/profile/:actorId/comments",
  async (req: Request, res: Response) => {
    const { workspaceSlug, actorId } = req.params
    if (
      typeof workspaceSlug !== "string" ||
      !workspaceSlug ||
      typeof actorId !== "string" ||
      !actorId
    ) {
      throw new AppError("Invalid params", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const ws = await loadWorkspaceBySlug(workspaceSlug)
    const actor = await resolveActor(ws.id, actorId)
    if (!actor) {
      throw new AppError("Profile not found", {
        status: 404,
        code: "PROFILE_NOT_FOUND",
      })
    }

    const cursor = decodeCursor(
      typeof req.query.cursor === "string" ? req.query.cursor : null,
      isCommentsCursor,
    )
    const limit = PAGE_SIZE.comments

    // Profile sorts comments DESC (newest first) — opposite of the
    // post-detail comments fetch which sorts ASC chronologically.
    // Cursor reuses the same `CommentsCursor` shape; we just pick the
    // direction here.
    const cursorWhere = cursor
      ? or(
          lt(comment.createdAt, new Date(cursor.ca)),
          and(
            eq(comment.createdAt, new Date(cursor.ca)),
            lt(comment.id, cursor.id),
          ),
        )
      : undefined

    const rows = await db
      .select({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        postId: post.id,
        postTitle: post.title,
        boardSlug: board.slug,
        boardName: board.name,
      })
      .from(comment)
      .innerJoin(post, eq(comment.postId, post.id))
      .innerJoin(board, eq(post.boardId, board.id))
      .where(
        and(
          eq(board.workspaceId, ws.id),
          eq(board.visibility, "public"),
          isNull(comment.deletedAt),
          or(
            eq(comment.authorId, actor.id),
            eq(comment.visitorId, actor.id),
          ),
          cursorWhere,
        ),
      )
      .orderBy(desc(comment.createdAt), desc(comment.id))
      .limit(limit + 1)

    const hasNext = rows.length > limit
    const pageRows = hasNext ? rows.slice(0, limit) : rows

    let nextCursor: string | null = null
    if (hasNext && pageRows.length > 0) {
      const last = pageRows[pageRows.length - 1]!
      nextCursor = encodeCursor({
        k: "comments",
        ca: last.createdAt.toISOString(),
        id: last.id,
      })
    }

    res.json({
      comments: pageRows.map((r) => ({
        id: r.id,
        body: r.body,
        createdAt: r.createdAt.toISOString(),
        post: { id: r.postId, title: r.postTitle },
        board: { slug: r.boardSlug, name: r.boardName },
      })),
      nextCursor,
    })
  },
)
