"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import type { SortOption } from "@/services/boards"
import {
  fetchAdminFeedback,
  fetchAdminPostsByBoard,
  fetchDashboardBoards,
  fetchRecentPosts,
} from "@/services/dashboard"

// Boards rarely change once a workspace is set up — bump beyond the 60s
// global default so navigating between admin pages (dashboard / feedback /
// roadmap / changelog / settings) reuses the cached list instead of
// triggering a refetch on every route change. Mutations that touch boards
// invalidate this key explicitly, so staleness during a real change is
// still fresh.
const FIVE_MINUTES = 5 * 60 * 1000

export function useDashboardBoardsQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.boards(),
    queryFn: fetchDashboardBoards,
    staleTime: FIVE_MINUTES,
  })
}

export function useRecentPostsQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.recentPosts(),
    queryFn: fetchRecentPosts,
  })
}

export function useAdminPostsByBoardInfiniteQuery(args: {
  boardId: string
  sort: SortOption
  search: string
}) {
  return useInfiniteQuery({
    queryKey: queryKeys.boards.posts(args.boardId, args.sort, args.search),
    queryFn: ({ pageParam }) =>
      fetchAdminPostsByBoard({
        boardId: args.boardId,
        cursor: pageParam,
        sort: args.sort,
        search: args.search,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!args.boardId,
  })
}

// Admin all-feedback inbox. Only fires when at least one of status /
// boardId is set — empty filter state renders the picker instead.
export function useAdminFeedbackInfiniteQuery(args: {
  boardId: string | null
  status: string | null
  sort: SortOption
  search: string
}) {
  return useInfiniteQuery({
    queryKey: queryKeys.dashboard.feedbackList(args),
    queryFn: ({ pageParam }) =>
      fetchAdminFeedback({
        boardId: args.boardId,
        status: args.status,
        cursor: pageParam,
        sort: args.sort,
        search: args.search,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!(args.boardId || args.status),
  })
}
