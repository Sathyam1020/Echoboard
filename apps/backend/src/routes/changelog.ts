import {
  and,
  db,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  lt,
  or,
  sql,
} from "@workspace/db/client"
import {
  board,
  changelogEntry,
  changelogPost,
  post,
  user,
  workspace,
} from "@workspace/db/schema"
import { Router, type Request, type Response } from "express"
import { z } from "zod"

import {
  decodeCursor,
  encodeCursor,
  isChangelogCursor,
  PAGE_SIZE,
  type ChangelogCursor,
} from "../lib/cursor.js"
import {
  assertCanMutateWorkspace,
  getActiveWorkspace,
} from "../lib/workspace-context.js"
import { AppError } from "../middleware/error-handler.js"
import { requireAuth } from "../middleware/require-auth.js"

export const changelogRouter: Router = Router()

// Loads the changelog entry + verifies the requester is admin+ of its
// workspace. Renamed from loadOwnedEntry — same purpose, role-aware now.
async function loadEntryWithMutatePerm(entryId: string, userId: string) {
  const [row] = await db
    .select({
      entry: changelogEntry,
      workspaceId: workspace.id,
    })
    .from(changelogEntry)
    .innerJoin(workspace, eq(changelogEntry.workspaceId, workspace.id))
    .where(eq(changelogEntry.id, entryId))

  if (!row) {
    throw new AppError("Changelog entry not found", {
      status: 404,
      code: "ENTRY_NOT_FOUND",
    })
  }
  await assertCanMutateWorkspace(userId, row.workspaceId)
  return row
}

// Resolves "the workspace the admin is currently working in" via the
// active_workspace_id cookie + workspace_member. Replaces the legacy
// "first owned workspace" lookup so admins can switch workspaces.
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

function serializeEntry(e: typeof changelogEntry.$inferSelect) {
  return {
    id: e.id,
    title: e.title,
    body: e.body,
    publishedAt: e.publishedAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    authorId: e.authorId,
    workspaceId: e.workspaceId,
  }
}

// GET /api/changelog?cursor= — admin list for the signed-in user's
// workspace. Cursor pagination over `effective_date desc, id desc`
// where effective_date = COALESCE(publishedAt, createdAt).
changelogRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  const session = res.locals.session!
  const ws = await loadActiveAdminWorkspace(req)

  const cursor = decodeCursor(
    typeof req.query.cursor === "string" ? req.query.cursor : null,
    isChangelogCursor,
  )
  const limit = PAGE_SIZE.changelog

  // Effective date — admins see drafts (publishedAt null) ordered by
  // createdAt; published entries by publishedAt. Single COALESCE column
  // gives us a stable tie-break across both buckets.
  const effectiveDate = sql<Date>`COALESCE(${changelogEntry.publishedAt}, ${changelogEntry.createdAt})`

  // Drizzle's `and()` filters out raw SQL fragments unless they're
  // wrapped in typed helpers. Use lt/eq/or so the cursor predicate
  // actually reaches the SQL — not just typechecks.
  const cursorWhere = cursor
    ? or(
        lt(effectiveDate, new Date(cursor.pa)),
        and(
          eq(effectiveDate, new Date(cursor.pa)),
          lt(changelogEntry.id, cursor.id),
        ),
      )
    : undefined

  const rows = await db
    .select()
    .from(changelogEntry)
    .where(and(eq(changelogEntry.workspaceId, ws.id), cursorWhere))
    .orderBy(desc(effectiveDate), desc(changelogEntry.id))
    .limit(limit + 1)

  const hasNext = rows.length > limit
  const entries = hasNext ? rows.slice(0, limit) : rows

  const ids = entries.map((e) => e.id)
  const linkedCounts = new Map<string, number>()
  if (ids.length > 0) {
    const linkRows = await db
      .select({
        entryId: changelogPost.changelogEntryId,
        count: sql<number>`count(*)::int`,
      })
      .from(changelogPost)
      .where(inArray(changelogPost.changelogEntryId, ids))
      .groupBy(changelogPost.changelogEntryId)
    for (const r of linkRows) linkedCounts.set(r.entryId, r.count)
  }

  let nextCursor: string | null = null
  if (hasNext && entries.length > 0) {
    const last = entries[entries.length - 1]!
    const lastDate = last.publishedAt ?? last.createdAt
    nextCursor = encodeCursor({
      k: "changelog",
      pa: lastDate.toISOString(),
      id: last.id,
    })
  }

  res.json({
    entries: entries.map((e) => ({
      ...serializeEntry(e),
      linkedPostCount: linkedCounts.get(e.id) ?? 0,
    })),
    nextCursor,
  })
})

// GET /api/changelog/public/:workspaceSlug — workspace metadata only.
// Entries moved to `/public/:ws/entries`.
changelogRouter.get(
  "/public/:workspaceSlug",
  async (req: Request, res: Response) => {
    const wsSlug = req.params.workspaceSlug
    if (typeof wsSlug !== "string" || !wsSlug) {
      throw new AppError("Invalid workspace slug", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const [ws] = await db
      .select()
      .from(workspace)
      .where(eq(workspace.slug, wsSlug))
    if (!ws) {
      throw new AppError("Workspace not found", {
        status: 404,
        code: "WORKSPACE_NOT_FOUND",
      })
    }

    const [firstBoard] = await db
      .select({ id: board.id, name: board.name, slug: board.slug })
      .from(board)
      .where(eq(board.workspaceId, ws.id))
      .orderBy(board.createdAt)
      .limit(1)

    res.json({
      workspace: { id: ws.id, name: ws.name, slug: ws.slug },
      firstBoard: firstBoard ?? null,
    })
  },
)

// GET /api/changelog/public/:workspaceSlug/entries?cursor= — paginated
// published entries. Author info is joined so the detail page can show
// "Written by …" without a second round-trip.
changelogRouter.get(
  "/public/:workspaceSlug/entries",
  async (req: Request, res: Response) => {
    const wsSlug = req.params.workspaceSlug
    if (typeof wsSlug !== "string" || !wsSlug) {
      throw new AppError("Invalid workspace slug", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const [ws] = await db
      .select()
      .from(workspace)
      .where(eq(workspace.slug, wsSlug))
    if (!ws) {
      throw new AppError("Workspace not found", {
        status: 404,
        code: "WORKSPACE_NOT_FOUND",
      })
    }

    const cursor = decodeCursor(
      typeof req.query.cursor === "string" ? req.query.cursor : null,
      isChangelogCursor,
    )
    const limit = PAGE_SIZE.changelog

    const cursorWhere = cursor
      ? or(
          lt(changelogEntry.publishedAt, new Date(cursor.pa)),
          and(
            eq(changelogEntry.publishedAt, new Date(cursor.pa)),
            lt(changelogEntry.id, cursor.id),
          ),
        )
      : undefined

    const entryRows = await db
      .select({
        entry: changelogEntry,
        authorName: user.name,
        authorImage: user.image,
        authorId: user.id,
      })
      .from(changelogEntry)
      .leftJoin(user, eq(changelogEntry.authorId, user.id))
      .where(
        and(
          eq(changelogEntry.workspaceId, ws.id),
          isNotNull(changelogEntry.publishedAt),
          cursorWhere,
        ),
      )
      .orderBy(desc(changelogEntry.publishedAt), desc(changelogEntry.id))
      .limit(limit + 1)

    const hasNext = entryRows.length > limit
    const pageRows = hasNext ? entryRows.slice(0, limit) : entryRows

    const ids = pageRows.map((r) => r.entry.id)
    const linkedMap = new Map<
      string,
      Array<{ id: string; title: string; boardSlug: string }>
    >()
    if (ids.length > 0) {
      const rows = await db
        .select({
          entryId: changelogPost.changelogEntryId,
          postId: post.id,
          title: post.title,
          boardSlug: board.slug,
        })
        .from(changelogPost)
        .innerJoin(post, eq(changelogPost.postId, post.id))
        .innerJoin(board, eq(post.boardId, board.id))
        .where(inArray(changelogPost.changelogEntryId, ids))
      for (const r of rows) {
        const list = linkedMap.get(r.entryId) ?? []
        list.push({ id: r.postId, title: r.title, boardSlug: r.boardSlug })
        linkedMap.set(r.entryId, list)
      }
    }

    let nextCursor: string | null = null
    if (hasNext && pageRows.length > 0) {
      const last = pageRows[pageRows.length - 1]!
      // publishedAt is guaranteed non-null by the WHERE clause above.
      nextCursor = encodeCursor({
        k: "changelog",
        pa: last.entry.publishedAt!.toISOString(),
        id: last.entry.id,
      })
    }

    res.json({
      entries: pageRows.map((r) => ({
        ...serializeEntry(r.entry),
        author: r.authorName
          ? {
              id: r.authorId ?? "",
              name: r.authorName,
              image: r.authorImage ?? null,
            }
          : null,
        linkedPosts: linkedMap.get(r.entry.id) ?? [],
      })),
      nextCursor,
    })
  },
)

// GET /api/changelog/:id — admin single entry.
changelogRouter.get(
  "/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id
    if (typeof id !== "string" || !id) {
      throw new AppError("Invalid id", { status: 400, code: "VALIDATION_ERROR" })
    }
    const session = res.locals.session!
    const row = await loadEntryWithMutatePerm(id, session.user.id)

    const linked = await db
      .select({
        id: post.id,
        title: post.title,
        boardName: board.name,
        boardSlug: board.slug,
      })
      .from(changelogPost)
      .innerJoin(post, eq(changelogPost.postId, post.id))
      .innerJoin(board, eq(post.boardId, board.id))
      .where(eq(changelogPost.changelogEntryId, id))

    res.json({
      entry: { ...serializeEntry(row.entry), linkedPosts: linked },
    })
  },
)

const createEntryBody = z.object({
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().min(1).max(20_000),
  postIds: z.array(z.string().min(1)).optional(),
})

// POST /api/changelog — create (draft by default).
changelogRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  const parsed = createEntryBody.safeParse(req.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", {
      status: 400,
      code: "VALIDATION_ERROR",
    })
  }

  const session = res.locals.session!
  const ws = await loadActiveAdminWorkspace(req)
  const id = crypto.randomUUID()

  await db.insert(changelogEntry).values({
    id,
    workspaceId: ws.id,
    authorId: session.user.id,
    title: parsed.data.title,
    body: parsed.data.body,
  })

  await linkPostsIfProvided(id, ws.id, parsed.data.postIds)

  const [row] = await db
    .select()
    .from(changelogEntry)
    .where(eq(changelogEntry.id, id))
  res.status(201).json({ entry: serializeEntry(row!) })
})

async function linkPostsIfProvided(
  entryId: string,
  workspaceId: string,
  postIds: string[] | undefined,
) {
  if (!postIds) return
  const unique = [...new Set(postIds)]

  if (unique.length > 0) {
    const valid = await db
      .select({ id: post.id })
      .from(post)
      .innerJoin(board, eq(post.boardId, board.id))
      .where(
        and(inArray(post.id, unique), eq(board.workspaceId, workspaceId)),
      )
    const validSet = new Set(valid.map((v) => v.id))
    if (validSet.size !== unique.length) {
      throw new AppError("One or more posts do not belong to this workspace", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }
  }

  await db
    .delete(changelogPost)
    .where(eq(changelogPost.changelogEntryId, entryId))
  if (unique.length > 0) {
    await db.insert(changelogPost).values(
      unique.map((postId) => ({
        changelogEntryId: entryId,
        postId,
      })),
    )
  }
}

const updateEntryBody = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    body: z.string().trim().min(1).max(20_000).optional(),
    postIds: z.array(z.string().min(1)).optional(),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.body !== undefined ||
      v.postIds !== undefined,
    { message: "Provide at least one field" },
  )

// PATCH /api/changelog/:id — update.
changelogRouter.patch(
  "/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id
    if (typeof id !== "string" || !id) {
      throw new AppError("Invalid id", { status: 400, code: "VALIDATION_ERROR" })
    }
    const parsed = updateEntryBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const session = res.locals.session!
    const row = await loadEntryWithMutatePerm(id, session.user.id)

    const patch: Record<string, unknown> = { updatedAt: sql`now()` }
    if (parsed.data.title !== undefined) patch.title = parsed.data.title
    if (parsed.data.body !== undefined) patch.body = parsed.data.body

    if (Object.keys(patch).length > 1) {
      await db
        .update(changelogEntry)
        .set(patch)
        .where(eq(changelogEntry.id, id))
    }

    await linkPostsIfProvided(id, row.entry.workspaceId, parsed.data.postIds)

    const [fresh] = await db
      .select()
      .from(changelogEntry)
      .where(eq(changelogEntry.id, id))
    res.json({ entry: serializeEntry(fresh!) })
  },
)

const publishBody = z.object({ published: z.boolean() })

// PATCH /api/changelog/:id/publish — toggle publish state.
changelogRouter.patch(
  "/:id/publish",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id
    if (typeof id !== "string" || !id) {
      throw new AppError("Invalid id", { status: 400, code: "VALIDATION_ERROR" })
    }
    const parsed = publishBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const session = res.locals.session!
    await loadEntryWithMutatePerm(id, session.user.id)

    const [updated] = await db
      .update(changelogEntry)
      .set({
        publishedAt: parsed.data.published ? sql`now()` : null,
        updatedAt: sql`now()`,
      })
      .where(eq(changelogEntry.id, id))
      .returning()
    res.json({ entry: serializeEntry(updated!) })
  },
)

// DELETE /api/changelog/:id.
changelogRouter.delete(
  "/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id
    if (typeof id !== "string" || !id) {
      throw new AppError("Invalid id", { status: 400, code: "VALIDATION_ERROR" })
    }
    const session = res.locals.session!
    await loadEntryWithMutatePerm(id, session.user.id)
    await db.delete(changelogEntry).where(eq(changelogEntry.id, id))
    res.json({ ok: true })
  },
)

// GET /api/changelog/helpers/shipped-posts?q= — editor picker.
changelogRouter.get(
  "/helpers/shipped-posts",
  requireAuth,
  async (req: Request, res: Response) => {
    const session = res.locals.session!
    const ws = await loadActiveAdminWorkspace(req)
    const rawQ = typeof req.query.q === "string" ? req.query.q.trim() : ""
    const q = rawQ.length > 0 ? `%${rawQ}%` : null

    const rows = await db
      .select({
        id: post.id,
        title: post.title,
        description: post.description,
        boardName: board.name,
        boardSlug: board.slug,
        voteCount: sql<number>`(SELECT count(*)::int FROM post_vote pv WHERE pv.post_id = ${post.id})`,
      })
      .from(post)
      .innerJoin(board, eq(post.boardId, board.id))
      .where(
        and(
          eq(board.workspaceId, ws.id),
          eq(post.status, "shipped"),
          q
            ? or(ilike(post.title, q), ilike(post.description, q))!
            : sql`true`,
        ),
      )
      .orderBy(desc(post.updatedAt))
      .limit(50)

    res.json({ posts: rows })
  },
)
