// Board service — browser-side. Used by useQuery / useInfiniteQuery hooks.
// The server-side equivalent lives in `boards.server.ts` and gets called
// from server components doing prefetch.
import { httpClient } from "@/lib/http/axios-client"
import type { PostRow } from "@/components/boards/types"

// ── Metadata-only responses (formerly returned posts inline) ─────────

export type BoardBySlugResponse = {
  workspace: { id: string; name: string; slug: string; ownerId: string }
  board: { id: string; name: string; slug: string; visibility: string }
  workspaceBoards: { id: string; name: string; slug: string }[]
}

export async function fetchBoardBySlug(args: {
  workspaceSlug: string
  boardSlug: string
}): Promise<BoardBySlugResponse> {
  const { data } = await httpClient.get<BoardBySlugResponse>(
    `/api/boards/by-slug/${encodeURIComponent(args.workspaceSlug)}/${encodeURIComponent(args.boardSlug)}`,
  )
  return data
}

export type AllFeedbackResponse = {
  workspace: { id: string; name: string; slug: string; ownerId: string }
  workspaceBoards: { id: string; name: string; slug: string }[]
}

export async function fetchAllFeedback(
  workspaceSlug: string,
): Promise<AllFeedbackResponse> {
  const { data } = await httpClient.get<AllFeedbackResponse>(
    `/api/boards/by-workspace/${encodeURIComponent(workspaceSlug)}`,
  )
  return data
}

// ── Paginated post lists ──────────────────────────────────────────────

export type SortOption = "newest" | "votes"

/** All-feedback posts carry their source board so the row can render a
 *  "from <board>" badge. Per-board posts inherit their board from URL. */
export type PostRowWithBoard = PostRow & {
  board: { id: string; name: string; slug: string } | null
}

export type PostsPage<T extends PostRow = PostRow> = {
  posts: T[]
  /** null → no more pages. */
  nextCursor: string | null
}

type FetchBoardPostsArgs = {
  workspaceSlug: string
  boardSlug: string
  cursor?: string | null
  sort?: SortOption
  search?: string
}

export async function fetchBoardPosts(
  args: FetchBoardPostsArgs,
): Promise<PostsPage<PostRow>> {
  const params = new URLSearchParams()
  if (args.cursor) params.set("cursor", args.cursor)
  if (args.sort && args.sort !== "newest") params.set("sort", args.sort)
  if (args.search) params.set("search", args.search)
  const qs = params.toString()
  const { data } = await httpClient.get<PostsPage<PostRow>>(
    `/api/boards/by-slug/${encodeURIComponent(args.workspaceSlug)}/${encodeURIComponent(args.boardSlug)}/posts${qs ? `?${qs}` : ""}`,
  )
  return data
}

type FetchAllFeedbackPostsArgs = {
  workspaceSlug: string
  cursor?: string | null
  sort?: SortOption
  search?: string
}

export async function fetchAllFeedbackPosts(
  args: FetchAllFeedbackPostsArgs,
): Promise<PostsPage<PostRowWithBoard>> {
  const params = new URLSearchParams()
  if (args.cursor) params.set("cursor", args.cursor)
  if (args.sort && args.sort !== "newest") params.set("sort", args.sort)
  if (args.search) params.set("search", args.search)
  const qs = params.toString()
  const { data } = await httpClient.get<PostsPage<PostRowWithBoard>>(
    `/api/boards/by-workspace/${encodeURIComponent(args.workspaceSlug)}/posts${qs ? `?${qs}` : ""}`,
  )
  return data
}

// ── Roadmap (non-paginated, status-bounded) ──────────────────────────

export type RoadmapResponse = {
  workspace: { id: string; name: string; slug: string; ownerId: string }
  board: { id: string; name: string; slug: string; visibility: string }
  /** All planned + in-progress posts plus the 50 most recent shipped. */
  posts: PostRow[]
}

export async function fetchBoardRoadmap(args: {
  workspaceSlug: string
  boardSlug: string
}): Promise<RoadmapResponse> {
  const { data } = await httpClient.get<RoadmapResponse>(
    `/api/boards/by-slug/${encodeURIComponent(args.workspaceSlug)}/${encodeURIComponent(args.boardSlug)}/roadmap`,
  )
  return data
}

type FetchBoardPostsByIdArgs = {
  boardId: string
  cursor?: string | null
  sort?: SortOption
  search?: string
}

export async function fetchPostsByBoard(
  args: FetchBoardPostsByIdArgs,
): Promise<PostsPage<PostRow>> {
  const params = new URLSearchParams()
  if (args.cursor) params.set("cursor", args.cursor)
  if (args.sort && args.sort !== "newest") params.set("sort", args.sort)
  if (args.search) params.set("search", args.search)
  const qs = params.toString()
  const { data } = await httpClient.get<PostsPage<PostRow>>(
    `/api/boards/${encodeURIComponent(args.boardId)}/posts${qs ? `?${qs}` : ""}`,
  )
  return data
}
