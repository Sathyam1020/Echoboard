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
