import { auth } from "@workspace/auth/server"
import { and, db, desc, eq, inArray, isNull, sql } from "@workspace/db/client"
import {
  board,
  comment,
  post,
  postVote,
  user,
  visitor,
  workspace,
} from "@workspace/db/schema"
import { fromNodeHeaders } from "better-auth/node"
import { Router, type Request, type Response } from "express"
import { z } from "zod"

import { AppError } from "../middleware/error-handler.js"
import { requireAnyAuth } from "../middleware/require-any-auth.js"

type PostListRow = {
  id: string
  title: string
  description: string
  status: string
  pinnedAt: Date | null
  createdAt: Date
  authorName: string | null
}

type LatestComment = {
  id: string
  body: string
  createdAt: string
  author: { id: string; name: string } | null
}

type EnrichedPost = Omit<PostListRow, "pinnedAt"> & {
  pinnedAt: string | null
  voteCount: number
  hasVoted: boolean
  commentCount: number
  latestComment: LatestComment | null
}

async function enrichPostsWithVotes(
  posts: PostListRow[],
  actor: OptionalActor,
): Promise<EnrichedPost[]> {
  if (posts.length === 0) return []
  const ids = posts.map((p) => p.id)

  // All four enrichment queries are independent — they only depend on the
  // post id list. Used to be sequential awaits (4 round-trips on the Neon
  // HTTP driver, ~600ms+ at typical latency); now in parallel (max of one).
  const votedQuery: Promise<{ postId: string }[]> =
    actor.kind === "user"
      ? db
          .select({ postId: postVote.postId })
          .from(postVote)
          .where(
            and(
              eq(postVote.userId, actor.userId),
              inArray(postVote.postId, ids),
            ),
          )
      : actor.kind === "visitor"
        ? db
            .select({ postId: postVote.postId })
            .from(postVote)
            .where(
              and(
                eq(postVote.visitorId, actor.visitorId),
                inArray(postVote.postId, ids),
              ),
            )
        : Promise.resolve([])

  const [countRows, votedRows, commentCountRows, latestRes] = await Promise.all(
    [
      db
        .select({
          postId: postVote.postId,
          count: sql<number>`count(*)::int`,
        })
        .from(postVote)
        .where(inArray(postVote.postId, ids))
        .groupBy(postVote.postId),
      votedQuery,
      db
        .select({
          postId: comment.postId,
          count: sql<number>`count(*)::int`,
        })
        .from(comment)
        .where(and(inArray(comment.postId, ids), isNull(comment.deletedAt)))
        .groupBy(comment.postId),
      db.execute(sql`
        SELECT DISTINCT ON (c.post_id)
          c.id AS id,
          c.post_id AS "postId",
          c.body AS body,
          c.created_at AS "createdAt",
          u.id AS "authorId",
          u.name AS "authorName"
        FROM comment c
        LEFT JOIN "user" u ON u.id = c.author_id
        WHERE c.post_id IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})
          AND c.deleted_at IS NULL
        ORDER BY c.post_id, c.created_at DESC
      `),
    ],
  )

  const counts = new Map<string, number>()
  for (const r of countRows) counts.set(r.postId, r.count)

  const votedSet = new Set(votedRows.map((r) => r.postId))

  const commentCounts = new Map<string, number>()
  for (const r of commentCountRows) commentCounts.set(r.postId, r.count)

  const latestMap = new Map<string, LatestComment>()
  for (const row of latestRes.rows as Array<{
    id: string
    postId: string
    body: string
    createdAt: Date | string
    authorId: string | null
    authorName: string | null
  }>) {
    const createdAt =
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt).toISOString()
    latestMap.set(row.postId, {
      id: row.id,
      body: row.body,
      createdAt,
      author:
        row.authorId && row.authorName
          ? { id: row.authorId, name: row.authorName }
          : null,
    })
  }

  return posts.map((p) => ({
    ...p,
    pinnedAt: p.pinnedAt?.toISOString() ?? null,
    voteCount: counts.get(p.id) ?? 0,
    hasVoted: votedSet.has(p.id),
    commentCount: commentCounts.get(p.id) ?? 0,
    latestComment: latestMap.get(p.id) ?? null,
  }))
}

export async function readOptionalUserId(
  req: Request,
): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })
  return session?.user?.id ?? null
}

export type OptionalActor =
  | { kind: "visitor"; visitorId: string }
  | { kind: "user"; userId: string }
  | { kind: "anonymous" }

// Used by GET endpoints that surface "did this actor vote" without forcing
// auth. Visitor cookie wins over admin session — explicit visitor lane.
export async function readOptionalActor(req: Request): Promise<OptionalActor> {
  // Lazy imports to avoid a circular dep with the visitor middleware.
  const { readVisitorToken } = await import(
    "../middleware/require-visitor.js"
  )
  const { loadVisitorBySession } = await import(
    "../lib/visitor-session.js"
  )
  const token = readVisitorToken(req)
  if (token) {
    const s = await loadVisitorBySession(token)
    if (s) return { kind: "visitor", visitorId: s.visitor.id }
  }
  const userId = await readOptionalUserId(req)
  if (userId) return { kind: "user", userId }
  return { kind: "anonymous" }
}

export const boardsRouter: Router = Router()

const createPostBody = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(1).max(4000),
})

boardsRouter.get(
  "/by-slug/:workspaceSlug/:boardSlug",
  async (req: Request, res: Response) => {
    const workspaceSlug = req.params.workspaceSlug
    const boardSlug = req.params.boardSlug
    if (
      typeof workspaceSlug !== "string" ||
      !workspaceSlug ||
      typeof boardSlug !== "string" ||
      !boardSlug
    ) {
      throw new AppError("Invalid slug", {
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
      .where(
        and(eq(workspace.slug, workspaceSlug), eq(board.slug, boardSlug)),
      )

    if (!row) {
      throw new AppError("Board not found", {
        status: 404,
        code: "BOARD_NOT_FOUND",
      })
    }

    if (row.board.visibility !== "public") {
      // Private boards aren't shippable in v1, but guard anyway so the route
      // stays correct as visibility support grows.
      throw new AppError("This board is private", {
        status: 403,
        code: "BOARD_PRIVATE",
      })
    }

    // Posts list, sibling boards, and the optional actor lookup are all
    // independent — fan out in parallel instead of sequential awaits.
    const [posts, workspaceBoards, actor] = await Promise.all([
      db
        .select({
          id: post.id,
          title: post.title,
          description: post.description,
          status: post.status,
          pinnedAt: post.pinnedAt,
          createdAt: post.createdAt,
          authorName: sql<
            string | null
          >`COALESCE(${user.name}, ${visitor.name})`,
        })
        .from(post)
        .leftJoin(user, eq(post.authorId, user.id))
        .leftJoin(visitor, eq(post.visitorId, visitor.id))
        .where(
          and(eq(post.boardId, row.board.id), isNull(post.mergedIntoPostId)),
        )
        .orderBy(sql`${post.pinnedAt} DESC NULLS LAST`, desc(post.createdAt)),
      // Sibling public boards in the same workspace — powers the "Boards"
      // card in the public sidebar so visitors can hop between boards
      // without going back to a (currently nonexistent) workspace index.
      db
        .select({ id: board.id, name: board.name, slug: board.slug })
        .from(board)
        .where(
          and(
            eq(board.workspaceId, row.workspace.id),
            eq(board.visibility, "public"),
          ),
        )
        .orderBy(board.createdAt),
      readOptionalActor(req),
    ])

    const enriched = await enrichPostsWithVotes(posts, actor)

    res.json({
      workspace: {
        id: row.workspace.id,
        name: row.workspace.name,
        slug: row.workspace.slug,
        ownerId: row.workspace.ownerId,
      },
      board: row.board,
      posts: enriched,
      workspaceBoards,
    })
  },
)

boardsRouter.get(
  "/:boardId/posts",
  async (req: Request, res: Response) => {
    const boardId = req.params.boardId
    if (typeof boardId !== "string" || !boardId) {
      throw new AppError("Invalid board id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const [b] = await db.select().from(board).where(eq(board.id, boardId))
    if (!b) {
      throw new AppError("Board not found", {
        status: 404,
        code: "BOARD_NOT_FOUND",
      })
    }

    const posts = await db
      .select({
        id: post.id,
        title: post.title,
        description: post.description,
        status: post.status,
        pinnedAt: post.pinnedAt,
        createdAt: post.createdAt,
        authorName: sql<
          string | null
        >`COALESCE(${user.name}, ${visitor.name})`,
      })
      .from(post)
      .leftJoin(user, eq(post.authorId, user.id))
      .leftJoin(visitor, eq(post.visitorId, visitor.id))
      .where(and(eq(post.boardId, b.id), isNull(post.mergedIntoPostId)))
      .orderBy(
        sql`${post.pinnedAt} DESC NULLS LAST`,
        desc(post.createdAt),
      )

    const actor = await readOptionalActor(req)
    const enriched = await enrichPostsWithVotes(posts, actor)

    res.json({ posts: enriched })
  },
)

boardsRouter.post(
  "/:boardId/posts",
  requireAnyAuth,
  async (req: Request, res: Response) => {
    const parsed = createPostBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const boardId = req.params.boardId
    if (typeof boardId !== "string" || !boardId) {
      throw new AppError("Invalid board id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }
    const [b] = await db.select().from(board).where(eq(board.id, boardId))
    if (!b) {
      throw new AppError("Board not found", {
        status: 404,
        code: "BOARD_NOT_FOUND",
      })
    }

    const id = crypto.randomUUID()

    // Branch on actor type. requireAnyAuth puts exactly one of these on
    // res.locals; visitors must belong to the same workspace as the board
    // they're posting on.
    const v = res.locals.visitor
    if (v) {
      if (v.workspaceId !== b.workspaceId) {
        throw new AppError("Visitor does not belong to this workspace", {
          status: 403,
          code: "WORKSPACE_MISMATCH",
        })
      }
      await db.insert(post).values({
        id,
        boardId: b.id,
        visitorId: v.id,
        title: parsed.data.title,
        description: parsed.data.description,
        status: "review",
      })
    } else {
      const session = res.locals.session!
      await db.insert(post).values({
        id,
        boardId: b.id,
        authorId: session.user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        status: "review",
      })
    }

    const [row] = await db
      .select({
        id: post.id,
        title: post.title,
        description: post.description,
        status: post.status,
        createdAt: post.createdAt,
        authorName: sql<
          string | null
        >`COALESCE(${user.name}, ${visitor.name})`,
      })
      .from(post)
      .leftJoin(user, eq(post.authorId, user.id))
      .leftJoin(visitor, eq(post.visitorId, visitor.id))
      .where(eq(post.id, id))

    res.status(201).json({ post: row })
  },
)
