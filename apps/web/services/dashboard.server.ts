import "server-only"

import { serverHttp } from "@/lib/http/server-axios"
import type { PostRow } from "@/components/boards/types"

import type { DashboardBoard, RecentPost } from "./dashboard"

export function fetchDashboardBoardsSSR(): Promise<{ boards: DashboardBoard[] }> {
  return serverHttp.get<{ boards: DashboardBoard[] }>("/api/dashboard/boards")
}

export function fetchRecentPostsSSR(): Promise<{ posts: RecentPost[] }> {
  return serverHttp.get<{ posts: RecentPost[] }>("/api/dashboard/recent-posts")
}

export function fetchAdminPostsByBoardSSR(boardId: string): Promise<{ posts: PostRow[] }> {
  return serverHttp.get<{ posts: PostRow[] }>(
    `/api/boards/${encodeURIComponent(boardId)}/posts`,
  )
}
