import { db, eq, sql } from "@workspace/db/client"
import { post } from "@workspace/db/schema"
import { Router, type Request, type Response } from "express"

import { AppError } from "../middleware/error-handler.js"
import { requireAuth } from "../middleware/require-auth.js"

export const postsRouter: Router = Router()

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
  },
)
