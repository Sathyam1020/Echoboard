import { auth } from "@workspace/auth/server"
import { and, db, desc, eq, inArray, sql } from "@workspace/db/client"
import { board, post, postVote, user, workspace } from "@workspace/db/schema"
import { fromNodeHeaders } from "better-auth/node"
import { Router, type Request, type Response } from "express"
import { z } from "zod"

import { AppError } from "../middleware/error-handler.js"
import { requireAuth } from "../middleware/require-auth.js"

type PostListRow = {
  id: string
  title: string
  description: string
  status: string
  createdAt: Date
  authorName: string | null
}

type EnrichedPost = PostListRow & {
  voteCount: number
  hasVoted: boolean
}

async function enrichPostsWithVotes(
  posts: PostListRow[],
  userId: string | null,
): Promise<EnrichedPost[]> {
  if (posts.length === 0) return []
  const ids = posts.map((p) => p.id)

  const countRows = await db
    .select({
      postId: postVote.postId,
      count: sql<number>`count(*)::int`,
    })
    .from(postVote)
    .where(inArray(postVote.postId, ids))
    .groupBy(postVote.postId)
  const counts = new Map<string, number>()
  for (const r of countRows) counts.set(r.postId, r.count)

  let votedSet = new Set<string>()
  if (userId) {
    const votedRows = await db
      .select({ postId: postVote.postId })
      .from(postVote)
      .where(and(eq(postVote.userId, userId), inArray(postVote.postId, ids)))
    votedSet = new Set(votedRows.map((r) => r.postId))
  }

  return posts.map((p) => ({
    ...p,
    voteCount: counts.get(p.id) ?? 0,
    hasVoted: votedSet.has(p.id),
  }))
}

async function readOptionalUserId(req: Request): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })
  return session?.user?.id ?? null
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

    const posts = await db
      .select({
        id: post.id,
        title: post.title,
        description: post.description,
        status: post.status,
        createdAt: post.createdAt,
        authorName: user.name,
      })
      .from(post)
      .leftJoin(user, eq(post.authorId, user.id))
      .where(eq(post.boardId, row.board.id))
      .orderBy(desc(post.createdAt))

    const userId = await readOptionalUserId(req)
    const enriched = await enrichPostsWithVotes(posts, userId)

    res.json({
      workspace: {
        id: row.workspace.id,
        name: row.workspace.name,
        slug: row.workspace.slug,
      },
      board: row.board,
      posts: enriched,
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
        createdAt: post.createdAt,
        authorName: user.name,
      })
      .from(post)
      .leftJoin(user, eq(post.authorId, user.id))
      .where(eq(post.boardId, b.id))
      .orderBy(desc(post.createdAt))

    const userId = await readOptionalUserId(req)
    const enriched = await enrichPostsWithVotes(posts, userId)

    res.json({ posts: enriched })
  },
)

boardsRouter.post(
  "/:boardId/posts",
  requireAuth,
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

    const session = res.locals.session!
    const id = crypto.randomUUID()

    await db.insert(post).values({
      id,
      boardId: b.id,
      authorId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      status: "review",
    })

    const [row] = await db
      .select({
        id: post.id,
        title: post.title,
        description: post.description,
        status: post.status,
        createdAt: post.createdAt,
        authorName: user.name,
      })
      .from(post)
      .leftJoin(user, eq(post.authorId, user.id))
      .where(eq(post.id, id))

    res.status(201).json({ post: row })
  },
)
