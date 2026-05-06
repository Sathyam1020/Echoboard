import "server-only"

import { serverHttp } from "@/lib/http/server-axios"
import type { PostRow } from "@/components/boards/types"
import type { PostRowWithBoard, PostsPage, SortOption } from "@/services/boards"

import type { DashboardBoard, RecentPost } from "./dashboard"

export function fetchDashboardBoardsSSR(): Promise<{ boards: DashboardBoard[] }> {
  return serverHttp.get<{ boards: DashboardBoard[] }>("/api/dashboard/boards")
}

export function fetchRecentPostsSSR(): Promise<{ posts: RecentPost[] }> {
  return serverHttp.get<{ posts: RecentPost[] }>("/api/dashboard/recent-posts")
}

export function fetchAdminPostsByBoardSSR(args: {
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
  return serverHttp.get<PostsPage<PostRow>>(
    `/api/boards/${encodeURIComponent(args.boardId)}/posts${qs ? `?${qs}` : ""}`,
  )
}

export function fetchAdminFeedbackSSR(args: {
  boardId?: string | null
  status?: string | null
  cursor?: string | null
  sort?: SortOption
  search?: string
}): Promise<PostsPage<PostRowWithBoard>> {
  const params = new URLSearchParams()
  if (args.boardId) params.set("boardId", args.boardId)
  if (args.status) params.set("status", args.status)
  if (args.cursor) params.set("cursor", args.cursor)
  if (args.sort && args.sort !== "newest") params.set("sort", args.sort)
  if (args.search) params.set("search", args.search)
  const qs = params.toString()
  return serverHttp.get<PostsPage<PostRowWithBoard>>(
    `/api/dashboard/feedback${qs ? `?${qs}` : ""}`,
  )
}
