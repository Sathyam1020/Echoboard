import "server-only"

import { serverHttp } from "@/lib/http/server-axios"
import type { PostRow } from "@/components/boards/types"

import type {
  AllFeedbackResponse,
  BoardBySlugResponse,
  PostRowWithBoard,
  PostsPage,
  RoadmapResponse,
  SortOption,
} from "./boards"

// Server-side mirror of `services/boards.ts`. Used by Server Components
// for prefetching into the QueryClient before HydrationBoundary hands
// off to the client. Same URL paths + response shapes — just routes
// through `serverHttp` (which forwards cookies + retries connection
// errors).

export function fetchBoardBySlugSSR(args: {
  workspaceSlug: string
  boardSlug: string
}): Promise<BoardBySlugResponse> {
  return serverHttp.get<BoardBySlugResponse>(
    `/api/boards/by-slug/${encodeURIComponent(args.workspaceSlug)}/${encodeURIComponent(args.boardSlug)}`,
  )
}

export function fetchAllFeedbackSSR(
  workspaceSlug: string,
): Promise<AllFeedbackResponse> {
  return serverHttp.get<AllFeedbackResponse>(
    `/api/boards/by-workspace/${encodeURIComponent(workspaceSlug)}`,
  )
}

type SSRPaginatedArgs = {
  cursor?: string | null
  sort?: SortOption
  search?: string
}

function buildQs(args: SSRPaginatedArgs): string {
  const params = new URLSearchParams()
  if (args.cursor) params.set("cursor", args.cursor)
  if (args.sort && args.sort !== "newest") params.set("sort", args.sort)
  if (args.search) params.set("search", args.search)
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

export function fetchBoardPostsSSR(
  args: { workspaceSlug: string; boardSlug: string } & SSRPaginatedArgs,
): Promise<PostsPage<PostRow>> {
  return serverHttp.get<PostsPage<PostRow>>(
    `/api/boards/by-slug/${encodeURIComponent(args.workspaceSlug)}/${encodeURIComponent(args.boardSlug)}/posts${buildQs(args)}`,
  )
}

export function fetchAllFeedbackPostsSSR(
  args: { workspaceSlug: string } & SSRPaginatedArgs,
): Promise<PostsPage<PostRowWithBoard>> {
  return serverHttp.get<PostsPage<PostRowWithBoard>>(
    `/api/boards/by-workspace/${encodeURIComponent(args.workspaceSlug)}/posts${buildQs(args)}`,
  )
}

export function fetchBoardRoadmapSSR(args: {
  workspaceSlug: string
  boardSlug: string
}): Promise<RoadmapResponse> {
  return serverHttp.get<RoadmapResponse>(
    `/api/boards/by-slug/${encodeURIComponent(args.workspaceSlug)}/${encodeURIComponent(args.boardSlug)}/roadmap`,
  )
}

export function fetchPostsByBoardSSR(
  args: { boardId: string } & SSRPaginatedArgs,
): Promise<PostsPage<PostRow>> {
  return serverHttp.get<PostsPage<PostRow>>(
    `/api/boards/${encodeURIComponent(args.boardId)}/posts${buildQs(args)}`,
  )
}
