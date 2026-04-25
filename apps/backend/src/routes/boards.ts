import { auth } from "@workspace/auth/server"
import {
  and,
  db,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
} from "@workspace/db/client"
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

import {
  decodeCursor,
  encodeCursor,
  isPostsCursor,
  PAGE_SIZE,
  parseSearch,
  parseSort,
  type PostsCursor,
} from "../lib/cursor.js"
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

// ── Paginated post fetch ────────────────────────────────────────────────
// Shared by the per-board (public + admin) and all-feedback endpoints.
// Returns enriched posts plus the cursor for the next page. The first
// page (cursor === null + includePinned) prepends pinned posts; cursor
// pages return only unpinned items so we never re-emit a pinned row.

type BoardFilter =
  | { kind: "single"; boardId: string }
  | { kind: "workspace"; workspaceId: string }

type PaginatePostsOpts = {
  boardFilter: BoardFilter
  cursor: PostsCursor | null
  sort: "newest" | "votes"
  search: string
  /** True for the first page only — pinned posts are returned ahead of
   *  the unpinned cursor batch, so cursor pages don't re-emit them. */
  includePinned: boolean
  /** All-feedback view sets this to attach `board` info to each post. */
  includeBoardOnPost?: boolean
  actor: OptionalActor
}

type PaginatedPostsResult<T extends EnrichedPost = EnrichedPost> = {
  posts: T[]
  nextCursor: string | null
}

async function paginatePosts(
  opts: PaginatePostsOpts,
): Promise<PaginatedPostsResult> {
  const { boardFilter, cursor, sort, search, includePinned, actor } = opts
  const limit = PAGE_SIZE.posts

  // Vote count subquery — used both as a SELECT field (so we can return
  // it without a second round-trip) and as part of ORDER BY when
  // sort=votes. Wrapped via `sql` so we can reuse the same expression.
  const voteCountSql = sql<number>`(SELECT COUNT(*)::int FROM post_vote WHERE post_vote.post_id = ${post.id})`

  // Board filter — single board id, or any public board within a
  // workspace.
  const boardScopeWhere =
    boardFilter.kind === "single"
      ? eq(post.boardId, boardFilter.boardId)
      : and(
          eq(board.workspaceId, boardFilter.workspaceId),
          eq(board.visibility, "public"),
        )!

  // Search filter — case-insensitive ILIKE on title or description.
  const searchWhere = search
    ? or(
        ilike(post.title, `%${search}%`),
        ilike(post.description, `%${search}%`),
      )!
    : undefined

  // Cursor predicate — strict "after this point in the sort order".
  // Tuple semantics expanded into OR-chains via Drizzle's typed
  // helpers (raw `sql` fragments inside `and()` get filtered out by
  // Drizzle's runtime guard, hence the explicit lt/eq/or here).
  let cursorWhere: ReturnType<typeof or> | undefined
  if (cursor) {
    if (cursor.k === "votes" && sort === "votes") {
      const vc = cursor.vc
      const ca = new Date(cursor.ca)
      cursorWhere = or(
        lt(voteCountSql, vc),
        and(eq(voteCountSql, vc), lt(post.createdAt, ca)),
        and(
          eq(voteCountSql, vc),
          eq(post.createdAt, ca),
          lt(post.id, cursor.id),
        ),
      )
    } else if (cursor.k === "newest" && sort === "newest") {
      const ca = new Date(cursor.ca)
      cursorWhere = or(
        lt(post.createdAt, ca),
        and(eq(post.createdAt, ca), lt(post.id, cursor.id)),
      )
    }
    // cursor/sort mismatch (e.g. a stale cursor for a different sort) —
    // ignore the cursor and return page 1 of the new sort.
  }

  // Build the SELECT. All-feedback view needs board info per post; the
  // single-board case skips the join.
  const baseSelect = {
    id: post.id,
    title: post.title,
    description: post.description,
    status: post.status,
    pinnedAt: post.pinnedAt,
    createdAt: post.createdAt,
    authorName: sql<string | null>`COALESCE(${user.name}, ${visitor.name})`,
  } as const

  const selectWithBoard = {
    ...baseSelect,
    boardId: board.id,
    boardName: board.name,
    boardSlug: board.slug,
  } as const

  // Fetch the unpinned page (limit + 1 so we can detect a next page).
  const unpinnedQueryBase =
    boardFilter.kind === "single"
      ? db
          .select(opts.includeBoardOnPost ? selectWithBoard : baseSelect)
          .from(post)
          .leftJoin(user, eq(post.authorId, user.id))
          .leftJoin(visitor, eq(post.visitorId, visitor.id))
          // Single-board mode still needs board join when caller asked
          // for board info on each row.
          .leftJoin(board, eq(post.boardId, board.id))
      : db
          .select(selectWithBoard)
          .from(post)
          .innerJoin(board, eq(post.boardId, board.id))
          .leftJoin(user, eq(post.authorId, user.id))
          .leftJoin(visitor, eq(post.visitorId, visitor.id))

  const unpinnedRows = await unpinnedQueryBase
    .where(
      and(
        boardScopeWhere,
        isNull(post.mergedIntoPostId),
        isNull(post.pinnedAt),
        searchWhere,
        cursorWhere,
      ),
    )
    .orderBy(
      ...(sort === "votes"
        ? [desc(voteCountSql), desc(post.createdAt), desc(post.id)]
        : [desc(post.createdAt), desc(post.id)]),
    )
    .limit(limit + 1)

  const hasNext = unpinnedRows.length > limit
  const pageRows = hasNext ? unpinnedRows.slice(0, limit) : unpinnedRows

  // Build next cursor from the last item in the page.
  let nextCursor: string | null = null
  if (hasNext) {
    const last = pageRows[pageRows.length - 1]!
    if (sort === "votes") {
      // We didn't select voteCount in the SELECT clause (it's only used
      // for ordering), so re-derive from enrichment after. To avoid a
      // second pass, also select voteCount here. Easier path: do the
      // enrichment first (gives us voteCount) and build the cursor.
      // Reordered below.
      nextCursor = encodeCursor({
        k: "votes",
        vc: 0, // placeholder; overwritten below after enrichment
        ca: last.createdAt.toISOString(),
        id: last.id,
      })
    } else {
      nextCursor = encodeCursor({
        k: "newest",
        ca: last.createdAt.toISOString(),
        id: last.id,
      })
    }
  }

  // Pinned posts (only on first page). Capped at 50 to keep first-page
  // payload bounded — workspaces with hyper-pinned activity cluster in
  // a single page rather than ballooning the response.
  let pinnedRows:
    | Awaited<typeof unpinnedQueryBase>
    | [] = []
  if (includePinned) {
    pinnedRows = await unpinnedQueryBase
      .where(
        and(
          boardScopeWhere,
          isNull(post.mergedIntoPostId),
          isNotNull(post.pinnedAt),
          searchWhere,
        ),
      )
      .orderBy(desc(post.pinnedAt), desc(post.createdAt), desc(post.id))
      .limit(50)
  }

  const allRows = [...pinnedRows, ...pageRows]

  // Strip board fields before passing to enrichPostsWithVotes (which
  // doesn't know about them), then re-attach after.
  const baseForEnrich: PostListRow[] = allRows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status,
    pinnedAt: r.pinnedAt,
    createdAt: r.createdAt,
    authorName: r.authorName,
  }))

  const enriched = await enrichPostsWithVotes(baseForEnrich, actor)

  // Re-attach board info if requested. Map by id so we keep the order
  // from `enriched` (which preserves SELECT order). The cast is safe —
  // when `includeBoardOnPost` is true the SELECT always includes board
  // columns; TS just can't narrow the union from outside the branch.
  const boardMap = opts.includeBoardOnPost
    ? new Map(
        (
          allRows as unknown as Array<{
            id: string
            boardId: string
            boardName: string
            boardSlug: string
          }>
        ).map((r) => [
          r.id,
          { id: r.boardId, name: r.boardName, slug: r.boardSlug },
        ]),
      )
    : null

  const finalPosts = enriched.map((p) =>
    boardMap ? { ...p, board: boardMap.get(p.id) ?? null } : p,
  )

  // For sort=votes we promised a cursor including vc. Now that we have
  // enriched vote counts, fix it up. (We always have voteCount for the
  // last unpinned post even if no pinned items were returned.)
  if (sort === "votes" && nextCursor && pageRows.length > 0) {
    const lastUnpinnedId = pageRows[pageRows.length - 1]!.id
    const lastEnriched = enriched.find((p) => p.id === lastUnpinnedId)
    const lastRow = pageRows[pageRows.length - 1]
    if (lastEnriched && lastRow) {
      nextCursor = encodeCursor({
        k: "votes",
        vc: lastEnriched.voteCount,
        ca: lastRow.createdAt.toISOString(),
        id: lastEnriched.id,
      })
    }
  }

  return { posts: finalPosts as EnrichedPost[], nextCursor }
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

// GET /api/boards/by-slug/:ws/:b — board metadata only. Posts moved to
// `/by-slug/:ws/:b/posts` (paginated). Splitting cuts the metadata
// payload to a fixed size and lets the post list grow independently
// without bloating the chrome request.
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
      throw new AppError("This board is private", {
        status: 403,
        code: "BOARD_PRIVATE",
      })
    }

    const workspaceBoards = await db
      .select({ id: board.id, name: board.name, slug: board.slug })
      .from(board)
      .where(
        and(
          eq(board.workspaceId, row.workspace.id),
          eq(board.visibility, "public"),
        ),
      )
      .orderBy(board.createdAt)

    res.json({
      workspace: {
        id: row.workspace.id,
        name: row.workspace.name,
        slug: row.workspace.slug,
        ownerId: row.workspace.ownerId,
      },
      board: row.board,
      workspaceBoards,
    })
  },
)

// GET /api/boards/by-slug/:ws/:b/posts?cursor=&sort=&search= — paginated
// post feed for a single public board. Cursor pagination over (sortKey,
// id). First page (no cursor) prepends pinned posts; subsequent pages
// return only unpinned items.
boardsRouter.get(
  "/by-slug/:workspaceSlug/:boardSlug/posts",
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
      .select({ board: board, workspace: workspace })
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
      throw new AppError("This board is private", {
        status: 403,
        code: "BOARD_PRIVATE",
      })
    }

    const cursor = decodeCursor(
      typeof req.query.cursor === "string" ? req.query.cursor : null,
      isPostsCursor,
    )
    const sort = parseSort(req.query.sort)
    const search = parseSearch(req.query.search)

    const result = await paginatePosts({
      boardFilter: { kind: "single", boardId: row.board.id },
      cursor,
      sort,
      search,
      includePinned: cursor === null,
      actor: await readOptionalActor(req),
    })

    res.json(result)
  },
)

// GET /api/boards/by-workspace/:workspaceSlug — workspace metadata for
// the "All feedback" view. Posts moved to `/by-workspace/:ws/posts`.
boardsRouter.get(
  "/by-workspace/:workspaceSlug",
  async (req: Request, res: Response) => {
    const workspaceSlug = req.params.workspaceSlug
    if (typeof workspaceSlug !== "string" || !workspaceSlug) {
      throw new AppError("Invalid slug", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const [ws] = await db
      .select()
      .from(workspace)
      .where(eq(workspace.slug, workspaceSlug))
    if (!ws) {
      throw new AppError("Workspace not found", {
        status: 404,
        code: "WORKSPACE_NOT_FOUND",
      })
    }

    const workspaceBoards = await db
      .select({ id: board.id, name: board.name, slug: board.slug })
      .from(board)
      .where(
        and(eq(board.workspaceId, ws.id), eq(board.visibility, "public")),
      )
      .orderBy(board.createdAt)

    res.json({
      workspace: {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        ownerId: ws.ownerId,
      },
      workspaceBoards,
    })
  },
)

// GET /api/boards/by-workspace/:ws/posts?cursor=&sort=&search= — paginated
// "All feedback" feed. Each post carries its source board so the row
// can render a "from <board>" badge.
boardsRouter.get(
  "/by-workspace/:workspaceSlug/posts",
  async (req: Request, res: Response) => {
    const workspaceSlug = req.params.workspaceSlug
    if (typeof workspaceSlug !== "string" || !workspaceSlug) {
      throw new AppError("Invalid slug", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const [ws] = await db
      .select()
      .from(workspace)
      .where(eq(workspace.slug, workspaceSlug))
    if (!ws) {
      throw new AppError("Workspace not found", {
        status: 404,
        code: "WORKSPACE_NOT_FOUND",
      })
    }

    const cursor = decodeCursor(
      typeof req.query.cursor === "string" ? req.query.cursor : null,
      isPostsCursor,
    )
    const sort = parseSort(req.query.sort)
    const search = parseSearch(req.query.search)

    const result = await paginatePosts({
      boardFilter: { kind: "workspace", workspaceId: ws.id },
      cursor,
      sort,
      search,
      includePinned: cursor === null,
      includeBoardOnPost: true,
      actor: await readOptionalActor(req),
    })

    res.json(result)
  },
)

// GET /api/boards/by-slug/:ws/:b/roadmap — non-paginated post list
// scoped to roadmap-relevant statuses. Roadmap groups posts by status
// (planned / in progress / shipped), which doesn't compose cleanly
// with cursor pagination. Caps shipped at the most recent 50 to keep
// the response bounded for boards with long shipped histories.
boardsRouter.get(
  "/by-slug/:workspaceSlug/:boardSlug/roadmap",
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
      .select({ board: board, workspace: workspace })
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
      throw new AppError("This board is private", {
        status: 403,
        code: "BOARD_PRIVATE",
      })
    }

    // Active statuses (planned/progress) are bounded by reality —
    // teams rarely have hundreds in flight. Shipped grows forever, so
    // cap it. Reviewing posts go on the feedback feed, not the roadmap.
    const [activePosts, shippedPosts] = await Promise.all([
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
          and(
            eq(post.boardId, row.board.id),
            isNull(post.mergedIntoPostId),
            inArray(post.status, ["planned", "progress"]),
          ),
        )
        .orderBy(desc(post.createdAt), desc(post.id)),
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
          and(
            eq(post.boardId, row.board.id),
            isNull(post.mergedIntoPostId),
            eq(post.status, "shipped"),
          ),
        )
        .orderBy(desc(post.createdAt), desc(post.id))
        .limit(50),
    ])

    const actor = await readOptionalActor(req)
    const enriched = await enrichPostsWithVotes(
      [...activePosts, ...shippedPosts],
      actor,
    )

    res.json({
      workspace: {
        id: row.workspace.id,
        name: row.workspace.name,
        slug: row.workspace.slug,
        ownerId: row.workspace.ownerId,
      },
      board: row.board,
      posts: enriched,
    })
  },
)

// GET /api/boards/:boardId/posts?cursor=&sort=&search= — admin/per-board
// paginated feed. Same pagination contract as the public by-slug
// endpoint; this one is keyed by raw board id (used by the dashboard).
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

    const cursor = decodeCursor(
      typeof req.query.cursor === "string" ? req.query.cursor : null,
      isPostsCursor,
    )
    const sort = parseSort(req.query.sort)
    const search = parseSearch(req.query.search)

    const result = await paginatePosts({
      boardFilter: { kind: "single", boardId: b.id },
      cursor,
      sort,
      search,
      includePinned: cursor === null,
      actor: await readOptionalActor(req),
    })

    res.json(result)
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
