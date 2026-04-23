import { and, asc, db, eq, sql } from "@workspace/db/client"
import {
  board,
  comment,
  post,
  postVote,
  user,
  workspace,
} from "@workspace/db/schema"
import { Router, type Request, type Response } from "express"
import { z } from "zod"

import {
  serializeComment,
  type CommentRow,
} from "../lib/serialize-comment.js"
import { AppError } from "../middleware/error-handler.js"
import { requireAuth } from "../middleware/require-auth.js"
import { readOptionalUserId } from "./boards.js"

export const postsRouter: Router = Router()

postsRouter.get("/:postId", async (req: Request, res: Response) => {
  const postId = req.params.postId
  if (typeof postId !== "string" || !postId) {
    throw new AppError("Invalid post id", {
      status: 400,
      code: "VALIDATION_ERROR",
    })
  }

  const [row] = await db
    .select({
      post: post,
      board: board,
      workspace: workspace,
      authorName: user.name,
    })
    .from(post)
    .innerJoin(board, eq(post.boardId, board.id))
    .innerJoin(workspace, eq(board.workspaceId, workspace.id))
    .leftJoin(user, eq(post.authorId, user.id))
    .where(eq(post.id, postId))

  if (!row) {
    throw new AppError("Post not found", {
      status: 404,
      code: "POST_NOT_FOUND",
    })
  }

  const userId = await readOptionalUserId(req)

  const voteCountRes = await db.execute(sql`
    SELECT COUNT(*)::int AS count FROM post_vote WHERE post_id = ${postId}
  `)
  const voteCount =
    (voteCountRes.rows as Array<{ count: number }>)[0]?.count ?? 0

  let hasVoted = false
  if (userId) {
    const [voted] = await db
      .select({ postId: postVote.postId })
      .from(postVote)
      .where(
        and(eq(postVote.postId, postId), eq(postVote.userId, userId)),
      )
    hasVoted = Boolean(voted)
  }

  const commentRows = await db
    .select({
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId,
      authorId: comment.authorId,
      body: comment.body,
      editedAt: comment.editedAt,
      deletedAt: comment.deletedAt,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      authorName: user.name,
    })
    .from(comment)
    .leftJoin(user, eq(comment.authorId, user.id))
    .where(eq(comment.postId, postId))
    .orderBy(asc(comment.createdAt))

  const workspaceOwnerId = row.workspace.ownerId
  const comments = commentRows.map((r) =>
    serializeComment(r as CommentRow, workspaceOwnerId),
  )

  res.json({
    post: {
      id: row.post.id,
      title: row.post.title,
      description: row.post.description,
      status: row.post.status,
      createdAt: row.post.createdAt.toISOString(),
      authorName: row.authorName,
      voteCount,
      hasVoted,
      board: {
        id: row.board.id,
        name: row.board.name,
        slug: row.board.slug,
      },
      workspace: {
        id: row.workspace.id,
        name: row.workspace.name,
        slug: row.workspace.slug,
        ownerId: row.workspace.ownerId,
      },
    },
    comments,
  })
})

const createCommentBody = z.object({
  body: z.string().trim().min(1).max(4000),
  parentId: z.string().min(1).optional().nullable(),
})

postsRouter.post(
  "/:postId/comments",
  requireAuth,
  async (req: Request, res: Response) => {
    const postId = req.params.postId
    if (typeof postId !== "string" || !postId) {
      throw new AppError("Invalid post id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const parsed = createCommentBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid input",
        { status: 400, code: "VALIDATION_ERROR" },
      )
    }

    const [row] = await db
      .select({
        post: post,
        workspaceOwnerId: workspace.ownerId,
      })
      .from(post)
      .innerJoin(board, eq(post.boardId, board.id))
      .innerJoin(workspace, eq(board.workspaceId, workspace.id))
      .where(eq(post.id, postId))

    if (!row) {
      throw new AppError("Post not found", {
        status: 404,
        code: "POST_NOT_FOUND",
      })
    }

    const parentId = parsed.data.parentId ?? null
    if (parentId) {
      const [parent] = await db
        .select({ id: comment.id, postId: comment.postId })
        .from(comment)
        .where(eq(comment.id, parentId))
      if (!parent) {
        throw new AppError("Parent comment not found", {
          status: 404,
          code: "COMMENT_NOT_FOUND",
        })
      }
      if (parent.postId !== postId) {
        throw new AppError("Parent comment does not belong to this post", {
          status: 400,
          code: "VALIDATION_ERROR",
        })
      }
    }

    const session = res.locals.session!
    const id = crypto.randomUUID()

    await db.insert(comment).values({
      id,
      postId,
      authorId: session.user.id,
      parentId,
      body: parsed.data.body,
    })

    const [inserted] = await db
      .select({
        id: comment.id,
        postId: comment.postId,
        parentId: comment.parentId,
        authorId: comment.authorId,
        body: comment.body,
        editedAt: comment.editedAt,
        deletedAt: comment.deletedAt,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        authorName: user.name,
      })
      .from(comment)
      .leftJoin(user, eq(comment.authorId, user.id))
      .where(eq(comment.id, id))

    if (!inserted) {
      throw new AppError("Comment not found after insert", {
        status: 500,
        code: "INTERNAL_ERROR",
      })
    }

    res.status(201).json({
      comment: serializeComment(inserted as CommentRow, row.workspaceOwnerId),
    })
  },
)

// voting routes
postsRouter.post(
  "/:postId/vote",
  requireAuth,
  async (req: Request, res: Response) => {
    const postId = req.params.postId
    if (typeof postId !== "string" || !postId) {
      throw new AppError("Invalid post id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const [p] = await db.select().from(post).where(eq(post.id, postId))
    if (!p) {
      throw new AppError("Post not found", {
        status: 404,
        code: "POST_NOT_FOUND",
      })
    }

    const userId = res.locals.session!.user.id

    const insertRes = await db.execute(sql`
      INSERT INTO post_vote (post_id, user_id)
      VALUES (${postId}, ${userId})
      ON CONFLICT (post_id, user_id) DO NOTHING
      RETURNING 1
    `)

    const wasInserted = (insertRes.rowCount ?? 0) > 0

    if (!wasInserted) {
      await db.execute(sql`
        DELETE FROM post_vote
        WHERE post_id = ${postId} AND user_id = ${userId}
      `)
    }

    const countRes = await db.execute(sql`
      SELECT COUNT(*)::int AS count FROM post_vote WHERE post_id = ${postId}
    `)
    const row = (countRes.rows as Array<{ count: number }>)[0]
    const voteCount = row?.count ?? 0

    res.json({ hasVoted: wasInserted, voteCount })
  }
)
