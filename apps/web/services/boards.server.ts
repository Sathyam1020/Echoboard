import "server-only"

import { serverHttp } from "@/lib/http/server-axios"
import type { PostRow } from "@/components/boards/types"

import type { AllFeedbackResponse, BoardBySlugResponse } from "./boards"

// Server-side mirror of `services/boards.ts`. Used by Server Components for
// prefetching into the QueryClient before HydrationBoundary hands off to
// the client. Same URL paths, same response shapes — just routes through
// `serverHttp` (which forwards cookies + retries connection errors).

export function fetchBoardBySlugSSR(args: {
  workspaceSlug: string
  boardSlug: string
}): Promise<BoardBySlugResponse> {
  return serverHttp.get<BoardBySlugResponse>(
    `/api/boards/by-slug/${encodeURIComponent(args.workspaceSlug)}/${encodeURIComponent(args.boardSlug)}`,
  )
}

export function fetchPostsByBoardSSR(boardId: string): Promise<{ posts: PostRow[] }> {
  return serverHttp.get<{ posts: PostRow[] }>(
    `/api/boards/${encodeURIComponent(boardId)}/posts`,
  )
}

export function fetchAllFeedbackSSR(
  workspaceSlug: string,
): Promise<AllFeedbackResponse> {
  return serverHttp.get<AllFeedbackResponse>(
    `/api/boards/by-workspace/${encodeURIComponent(workspaceSlug)}`,
  )
}
