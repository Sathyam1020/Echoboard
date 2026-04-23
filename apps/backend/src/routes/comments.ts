import { db, eq, sql } from "@workspace/db/client"
import { board, comment, post, user, workspace } from "@workspace/db/schema"
import { Router, type Request, type Response } from "express"
import { z } from "zod"

import {
  serializeComment,
  type CommentRow,
} from "../lib/serialize-comment.js"
import { AppError } from "../middleware/error-handler.js"
import { requireAuth } from "../middleware/require-auth.js"

export const commentsRouter: Router = Router()

const updateCommentBody = z.object({
  body: z.string().trim().min(1).max(4000),
})

async function loadCommentWithOwner(commentId: string) {
  const [row] = await db
    .select({
      comment: comment,
      workspaceOwnerId: workspace.ownerId,
    })
    .from(comment)
    .innerJoin(post, eq(comment.postId, post.id))
    .innerJoin(board, eq(post.boardId, board.id))
    .innerJoin(workspace, eq(board.workspaceId, workspace.id))
    .where(eq(comment.id, commentId))
  return row ?? null
}

function assertCanMutate(
  userId: string,
  authorId: string,
  workspaceOwnerId: string,
): void {
  if (userId !== authorId && userId !== workspaceOwnerId) {
    throw new AppError("You cannot modify this comment", {
      status: 403,
      code: "FORBIDDEN",
    })
  }
}

commentsRouter.patch(
  "/:commentId",
  requireAuth,
  async (req: Request, res: Response) => {
    const commentId = req.params.commentId
    if (typeof commentId !== "string" || !commentId) {
      throw new AppError("Invalid comment id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const parsed = updateCommentBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid input",
        { status: 400, code: "VALIDATION_ERROR" },
      )
    }

    const row = await loadCommentWithOwner(commentId)
    if (!row) {
      throw new AppError("Comment not found", {
        status: 404,
        code: "COMMENT_NOT_FOUND",
      })
    }

    if (row.comment.deletedAt) {
      throw new AppError("Cannot edit a deleted comment", {
        status: 400,
        code: "COMMENT_DELETED",
      })
    }

    const userId = res.locals.session!.user.id
    assertCanMutate(userId, row.comment.authorId, row.workspaceOwnerId)

    await db
      .update(comment)
      .set({
        body: parsed.data.body,
        editedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(eq(comment.id, commentId))

    const [updated] = await db
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
      .where(eq(comment.id, commentId))

    if (!updated) {
      throw new AppError("Comment not found after update", {
        status: 500,
        code: "INTERNAL_ERROR",
      })
    }

    res.json({
      comment: serializeComment(updated as CommentRow, row.workspaceOwnerId),
    })
  },
)

commentsRouter.delete(
  "/:commentId",
  requireAuth,
  async (req: Request, res: Response) => {
    const commentId = req.params.commentId
    if (typeof commentId !== "string" || !commentId) {
      throw new AppError("Invalid comment id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const row = await loadCommentWithOwner(commentId)
    if (!row) {
      throw new AppError("Comment not found", {
        status: 404,
        code: "COMMENT_NOT_FOUND",
      })
    }

    const userId = res.locals.session!.user.id
    assertCanMutate(userId, row.comment.authorId, row.workspaceOwnerId)

    if (!row.comment.deletedAt) {
      await db
        .update(comment)
        .set({
          deletedAt: sql`now()`,
          updatedAt: sql`now()`,
        })
        .where(eq(comment.id, commentId))
    }

    const [updated] = await db
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
      .where(eq(comment.id, commentId))

    if (!updated) {
      throw new AppError("Comment not found after delete", {
        status: 500,
        code: "INTERNAL_ERROR",
      })
    }

    res.json({
      comment: serializeComment(updated as CommentRow, row.workspaceOwnerId),
    })
  },
)
