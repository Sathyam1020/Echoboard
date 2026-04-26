import { db, desc, eq, sql } from "@workspace/db/client"
import { board, post, user, visitor, workspace } from "@workspace/db/schema"
import { Router, type Request, type Response } from "express"

import { requireAuth } from "../middleware/require-auth.js"

export const dashboardRouter: Router = Router()

dashboardRouter.get(
  "/boards",
  requireAuth,
  async (_req: Request, res: Response) => {
    const session = res.locals.session!

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
      .where(eq(workspace.ownerId, session.user.id))
      .groupBy(board.id, workspace.id)
      .orderBy(desc(board.createdAt))

    res.json({ boards: rows })
  },
)

dashboardRouter.get(
  "/recent-posts",
  requireAuth,
  async (_req: Request, res: Response) => {
    const session = res.locals.session!

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
      .where(eq(workspace.ownerId, session.user.id))
      .orderBy(desc(post.createdAt))
      .limit(5)

    res.json({ posts: rows })
  },
)
