import { httpClient } from "@/lib/http/axios-client"
import type { PostRow } from "@/components/boards/types"

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

export async function fetchAdminPostsByBoard(boardId: string): Promise<{ posts: PostRow[] }> {
  const { data } = await httpClient.get<{ posts: PostRow[] }>(
    `/api/boards/${encodeURIComponent(boardId)}/posts`,
  )
  return data
}
