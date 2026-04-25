// Board service — browser-side. Used by useQuery hooks. The server-side
// equivalent lives in `boards.server.ts` and gets called from server
// components doing prefetch.
import { httpClient } from "@/lib/http/axios-client"
import type { PostRow } from "@/components/boards/types"

export type BoardBySlugResponse = {
  workspace: { id: string; name: string; slug: string; ownerId: string }
  board: { id: string; name: string; slug: string; visibility: string }
  posts: PostRow[]
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

export async function fetchPostsByBoard(boardId: string): Promise<{ posts: PostRow[] }> {
  const { data } = await httpClient.get<{ posts: PostRow[] }>(
    `/api/boards/${encodeURIComponent(boardId)}/posts`,
  )
  return data
}

/** Posts in the all-feedback view carry their source board so the row
 *  can render a board badge. The per-board endpoints return `PostRow`
 *  without a board (the board is implicit from the URL). */
export type PostRowWithBoard = PostRow & {
  board: { id: string; name: string; slug: string } | null
}

export type AllFeedbackResponse = {
  workspace: { id: string; name: string; slug: string; ownerId: string }
  posts: PostRowWithBoard[]
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
