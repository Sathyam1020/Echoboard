import { and, asc, db, desc, eq, sql } from "@workspace/db/client"
import {
  board,
  comment,
  post,
  postVote,
  user,
  visitor,
  workspace,
} from "@workspace/db/schema"
import { randomUUID } from "node:crypto"
import { Router, type Request, type Response } from "express"
import { z } from "zod"

import {
  serializeComment,
  type CommentRow,
} from "../lib/serialize-comment.js"
import { AppError } from "../middleware/error-handler.js"
import { requireAnyAuth } from "../middleware/require-any-auth.js"
import { requireAuth } from "../middleware/require-auth.js"
import { readOptionalUserId } from "./boards.js"

export const postsRouter: Router = Router()

// Fetch a post along with its workspace ownership info. Throws 404 if missing.
async function loadPostWithOwnership(postId: string) {
  const [row] = await db
    .select({
      post: post,
      workspaceOwnerId: workspace.ownerId,
      boardId: post.boardId,
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
  return row
}

// Guard: only the workspace owner can run this mutation.
function assertIsWorkspaceOwner(
  workspaceOwnerId: string,
  userId: string,
  message = "Only workspace owner can perform this action",
): void {
  if (workspaceOwnerId !== userId) {
    throw new AppError(message, { status: 403, code: "FORBIDDEN" })
  }
}

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
      authorName: sql<string | null>`COALESCE(${user.name}, ${visitor.name})`,
    })
    .from(post)
    .innerJoin(board, eq(post.boardId, board.id))
    .innerJoin(workspace, eq(board.workspaceId, workspace.id))
    .leftJoin(user, eq(post.authorId, user.id))
    .leftJoin(visitor, eq(post.visitorId, visitor.id))
    .where(eq(post.id, postId))

  if (!row) {
    throw new AppError("Post not found", {
      status: 404,
      code: "POST_NOT_FOUND",
    })
  }

  // viewerIsOwner is admin-only — visitor identity never makes you an admin.
  const userId = await readOptionalUserId(req)
  const viewerIsOwner = userId !== null && userId === row.workspace.ownerId
  // Resolve the actor (visitor cookie wins over admin session) so we can
  // tell the FE whether the current viewer has voted on this post.
  const { readOptionalActor } = await import("./boards.js")
  const actor = await readOptionalActor(req)

  // If this post was merged into another, attach a `mergedInto` pointer so the
  // frontend can redirect. The source row keeps existing, but has no votes/
  // comments left (those were moved during the merge).
  let mergedInto: { id: string; title: string } | null = null
  if (row.post.mergedIntoPostId) {
    const [target] = await db
      .select({ id: post.id, title: post.title })
      .from(post)
      .where(eq(post.id, row.post.mergedIntoPostId))
    if (target) {
      mergedInto = { id: target.id, title: target.title }
    }
  }

  const voteCountRes = await db.execute(sql`
    SELECT COUNT(*)::int AS count FROM post_vote WHERE post_id = ${postId}
  `)
  const voteCount =
    (voteCountRes.rows as Array<{ count: number }>)[0]?.count ?? 0

  let hasVoted = false
  if (actor.kind === "user") {
    const [voted] = await db
      .select({ postId: postVote.postId })
      .from(postVote)
      .where(
        and(eq(postVote.postId, postId), eq(postVote.userId, actor.userId)),
      )
    hasVoted = Boolean(voted)
  } else if (actor.kind === "visitor") {
    const [voted] = await db
      .select({ postId: postVote.postId })
      .from(postVote)
      .where(
        and(
          eq(postVote.postId, postId),
          eq(postVote.visitorId, actor.visitorId),
        ),
      )
    hasVoted = Boolean(voted)
  }

  // Voter list is admin-only. Top 20 most recent voters with names for the
  // sidebar. Voter could be either a user (admin) or a visitor (end-user).
  let voters: Array<{ id: string; name: string; votedAt: string }> | null = null
  if (viewerIsOwner) {
    const voterRows = await db
      .select({
        userId: user.id,
        userName: user.name,
        visitorId: visitor.id,
        visitorName: visitor.name,
        votedAt: postVote.createdAt,
      })
      .from(postVote)
      .leftJoin(user, eq(postVote.userId, user.id))
      .leftJoin(visitor, eq(postVote.visitorId, visitor.id))
      .where(eq(postVote.postId, postId))
      .orderBy(desc(postVote.createdAt))
      .limit(20)
    voters = voterRows.map((v) => ({
      id: v.userId ?? v.visitorId ?? "",
      name: v.userName ?? v.visitorName ?? "Unknown",
      votedAt: v.votedAt.toISOString(),
    }))
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
      authorName: sql<string | null>`COALESCE(${user.name}, ${visitor.name})`,
    })
    .from(comment)
    .leftJoin(user, eq(comment.authorId, user.id))
    .leftJoin(visitor, eq(comment.visitorId, visitor.id))
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
      pinnedAt: row.post.pinnedAt?.toISOString() ?? null,
      mergedInto,
      createdAt: row.post.createdAt.toISOString(),
      authorName: row.authorName,
      voteCount,
      hasVoted,
      viewerIsOwner,
      voters,
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

const updatePostStatusBody = z.object({
  status: z.enum(["review", "planned", "progress", "shipped"]),
})

postsRouter.patch(
  "/:postId/status",
  requireAuth,
  async (req: Request, res: Response) => {
    const postId = req.params.postId
    if (typeof postId !== "string" || !postId) {
      throw new AppError("Invalid post id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const parsed = updatePostStatusBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid input",
        { status: 400, code: "VALIDATION_ERROR" },
      )
    }

    const row = await loadPostWithOwnership(postId)
    const userId = res.locals.session!.user.id
    assertIsWorkspaceOwner(
      row.workspaceOwnerId,
      userId,
      "Only workspace owner can change status",
    )

    const [updated] = await db
      .update(post)
      .set({
        status: parsed.data.status,
        updatedAt: sql`now()`,
      })
      .where(eq(post.id, postId))
      .returning({ id: post.id, status: post.status })

    if (!updated) {
      throw new AppError("Post not found after update", {
        status: 500,
        code: "INTERNAL_ERROR",
      })
    }

    res.json({
      post: {
        id: updated.id,
        status: updated.status,
      },
    })
  },
)

const updatePostBody = z
  .object({
    title: z.string().trim().min(3).max(140).optional(),
    description: z.string().trim().min(1).max(4000).optional(),
  })
  .refine((v) => v.title !== undefined || v.description !== undefined, {
    message: "Provide title or description",
  })

postsRouter.patch(
  "/:postId",
  requireAuth,
  async (req: Request, res: Response) => {
    const postId = req.params.postId
    if (typeof postId !== "string" || !postId) {
      throw new AppError("Invalid post id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const parsed = updatePostBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid input",
        { status: 400, code: "VALIDATION_ERROR" },
      )
    }

    const row = await loadPostWithOwnership(postId)
    const userId = res.locals.session!.user.id
    assertIsWorkspaceOwner(
      row.workspaceOwnerId,
      userId,
      "Only workspace owner can edit this post",
    )

    const patch: Record<string, unknown> = { updatedAt: sql`now()` }
    if (parsed.data.title !== undefined) patch.title = parsed.data.title
    if (parsed.data.description !== undefined)
      patch.description = parsed.data.description

    const [updated] = await db
      .update(post)
      .set(patch)
      .where(eq(post.id, postId))
      .returning({
        id: post.id,
        title: post.title,
        description: post.description,
      })

    if (!updated) {
      throw new AppError("Post not found after update", {
        status: 500,
        code: "INTERNAL_ERROR",
      })
    }

    res.json({ post: updated })
  },
)

postsRouter.delete(
  "/:postId",
  requireAuth,
  async (req: Request, res: Response) => {
    const postId = req.params.postId
    if (typeof postId !== "string" || !postId) {
      throw new AppError("Invalid post id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const row = await loadPostWithOwnership(postId)
    const userId = res.locals.session!.user.id
    assertIsWorkspaceOwner(
      row.workspaceOwnerId,
      userId,
      "Only workspace owner can delete this post",
    )

    // FK cascades handle votes + comments. Any post that had `merged_into = this`
    // falls back to null via ON DELETE SET NULL.
    await db.delete(post).where(eq(post.id, postId))

    res.json({ ok: true })
  },
)

const pinPostBody = z.object({ pinned: z.boolean() })

postsRouter.patch(
  "/:postId/pin",
  requireAuth,
  async (req: Request, res: Response) => {
    const postId = req.params.postId
    if (typeof postId !== "string" || !postId) {
      throw new AppError("Invalid post id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const parsed = pinPostBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid input",
        { status: 400, code: "VALIDATION_ERROR" },
      )
    }

    const row = await loadPostWithOwnership(postId)
    const userId = res.locals.session!.user.id
    assertIsWorkspaceOwner(
      row.workspaceOwnerId,
      userId,
      "Only workspace owner can pin posts",
    )

    const [updated] = await db
      .update(post)
      .set({
        pinnedAt: parsed.data.pinned ? sql`now()` : null,
        updatedAt: sql`now()`,
      })
      .where(eq(post.id, postId))
      .returning({ id: post.id, pinnedAt: post.pinnedAt })

    if (!updated) {
      throw new AppError("Post not found after update", {
        status: 500,
        code: "INTERNAL_ERROR",
      })
    }

    res.json({
      post: {
        id: updated.id,
        pinnedAt: updated.pinnedAt?.toISOString() ?? null,
      },
    })
  },
)

const mergePostBody = z.object({
  targetPostId: z.string().min(1),
})

postsRouter.post(
  "/:postId/merge",
  requireAuth,
  async (req: Request, res: Response) => {
    const sourceId = req.params.postId
    if (typeof sourceId !== "string" || !sourceId) {
      throw new AppError("Invalid post id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const parsed = mergePostBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid input",
        { status: 400, code: "VALIDATION_ERROR" },
      )
    }

    const targetId = parsed.data.targetPostId
    if (sourceId === targetId) {
      throw new AppError("Cannot merge a post into itself", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const source = await loadPostWithOwnership(sourceId)
    const userId = res.locals.session!.user.id
    assertIsWorkspaceOwner(
      source.workspaceOwnerId,
      userId,
      "Only workspace owner can merge posts",
    )

    if (source.post.mergedIntoPostId) {
      throw new AppError("Source post is already merged", {
        status: 400,
        code: "ALREADY_MERGED",
      })
    }

    const target = await loadPostWithOwnership(targetId)
    if (target.post.mergedIntoPostId) {
      throw new AppError("Target post is itself merged", {
        status: 400,
        code: "TARGET_MERGED",
      })
    }
    if (target.boardId !== source.boardId) {
      throw new AppError("Posts must be on the same board", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    // Atomic batch — neon-http runs the array as a single server-side
    // transaction. Vote duplicates are skipped via ON CONFLICT DO NOTHING so
    // the unique (post_id, user_id) constraint holds.
    await db.batch([
      db.execute(sql`
        UPDATE comment
        SET post_id = ${targetId}
        WHERE post_id = ${sourceId}
      `),
      db.execute(sql`
        INSERT INTO post_vote (post_id, user_id, created_at)
        SELECT ${targetId}, user_id, created_at
        FROM post_vote
        WHERE post_id = ${sourceId}
        ON CONFLICT (post_id, user_id) DO NOTHING
      `),
      db.execute(sql`
        DELETE FROM post_vote WHERE post_id = ${sourceId}
      `),
      db
        .update(post)
        .set({ mergedIntoPostId: targetId, updatedAt: sql`now()` })
        .where(eq(post.id, sourceId)),
    ])

    res.json({
      merged: { sourceId, targetId },
    })
  },
)

const createCommentBody = z.object({
  body: z.string().trim().min(1).max(4000),
  parentId: z.string().min(1).optional().nullable(),
})

postsRouter.post(
  "/:postId/comments",
  requireAnyAuth,
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
        workspaceId: workspace.id,
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

    const id = randomUUID()
    const v = res.locals.visitor
    if (v) {
      if (v.workspaceId !== row.workspaceId) {
        throw new AppError("Visitor does not belong to this workspace", {
          status: 403,
          code: "WORKSPACE_MISMATCH",
        })
      }
      await db.insert(comment).values({
        id,
        postId,
        visitorId: v.id,
        parentId,
        body: parsed.data.body,
      })
    } else {
      const session = res.locals.session!
      await db.insert(comment).values({
        id,
        postId,
        authorId: session.user.id,
        parentId,
        body: parsed.data.body,
      })
    }

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
        authorName: sql<string | null>`COALESCE(${user.name}, ${visitor.name})`,
      })
      .from(comment)
      .leftJoin(user, eq(comment.authorId, user.id))
      .leftJoin(visitor, eq(comment.visitorId, visitor.id))
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

// Toggle vote — accepts either admin session OR visitor token. We resolve
// the existing vote first (avoids fighting partial-unique-index ON CONFLICT
// targeting), then DELETE-or-INSERT.
postsRouter.post(
  "/:postId/vote",
  requireAnyAuth,
  async (req: Request, res: Response) => {
    const postId = req.params.postId
    if (typeof postId !== "string" || !postId) {
      throw new AppError("Invalid post id", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const [postRow] = await db
      .select({ id: post.id, boardId: post.boardId })
      .from(post)
      .where(eq(post.id, postId))
    if (!postRow) {
      throw new AppError("Post not found", {
        status: 404,
        code: "POST_NOT_FOUND",
      })
    }

    const v = res.locals.visitor
    let where
    if (v) {
      // Workspace match — visitor must vote within their own workspace.
      const [b] = await db
        .select({ workspaceId: board.workspaceId })
        .from(board)
        .where(eq(board.id, postRow.boardId))
      if (!b || b.workspaceId !== v.workspaceId) {
        throw new AppError("Visitor does not belong to this workspace", {
          status: 403,
          code: "WORKSPACE_MISMATCH",
        })
      }
      where = and(eq(postVote.postId, postId), eq(postVote.visitorId, v.id))
    } else {
      const userId = res.locals.session!.user.id
      where = and(eq(postVote.postId, postId), eq(postVote.userId, userId))
    }

    const [existing] = await db
      .select({ id: postVote.id })
      .from(postVote)
      .where(where)

    let hasVoted: boolean
    if (existing) {
      await db.delete(postVote).where(eq(postVote.id, existing.id))
      hasVoted = false
    } else {
      await db.insert(postVote).values({
        id: randomUUID(),
        postId,
        userId: v ? null : res.locals.session!.user.id,
        visitorId: v ? v.id : null,
      })
      hasVoted = true
    }

    const countRes = await db.execute(sql`
      SELECT COUNT(*)::int AS count FROM post_vote WHERE post_id = ${postId}
    `)
    const row = (countRes.rows as Array<{ count: number }>)[0]
    const voteCount = row?.count ?? 0

    res.json({ hasVoted, voteCount })
  },
)

