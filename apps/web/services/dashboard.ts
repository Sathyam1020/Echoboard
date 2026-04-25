import { httpClient } from "@/lib/http/axios-client"
import type { PostRow } from "@/components/boards/types"
import type { PostsPage, SortOption } from "@/services/boards"

export type DashboardBoard = {
  boardId: string
  boardName: string
  boardSlug: string
  boardVisibility: string
  workspaceSlug: string
  workspaceName: string
  postCount: number
  createdAt: string
}

export type RecentPost = {
  id: string
  title: string
  description: string
  status: string
  createdAt: string
  authorName: string | null
  boardName: string
  boardSlug: string
  workspaceSlug: string
}

export async function fetchDashboardBoards(): Promise<{ boards: DashboardBoard[] }> {
  const { data } = await httpClient.get<{ boards: DashboardBoard[] }>(
    "/api/dashboard/boards",
  )
  return data
}

export async function fetchRecentPosts(): Promise<{ posts: RecentPost[] }> {
  const { data } = await httpClient.get<{ posts: RecentPost[] }>(
    "/api/dashboard/recent-posts",
  )
  return data
}

export async function fetchAdminPostsByBoard(args: {
  boardId: string
  cursor?: string | null
  sort?: SortOption
  search?: string
}): Promise<PostsPage<PostRow>> {
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
