"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import {
  fetchAdminPostsByBoard,
  fetchDashboardBoards,
  fetchRecentPosts,
} from "@/services/dashboard"

export function useDashboardBoardsQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.boards(),
    queryFn: fetchDashboardBoards,
  })
}

export function useRecentPostsQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.recentPosts(),
    queryFn: fetchRecentPosts,
  })
}

export function useAdminPostsByBoardQuery(boardId: string) {
  return useQuery({
    queryKey: queryKeys.boards.posts(boardId),
    queryFn: () => fetchAdminPostsByBoard(boardId),
    enabled: !!boardId,
  })
}
