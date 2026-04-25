"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import {
  fetchAllFeedback,
  fetchAllFeedbackPosts,
  type SortOption,
} from "@/services/boards"

// Workspace-root metadata (workspace + workspaceBoards). Posts paginate
// through `useAllFeedbackPostsInfiniteQuery` below.
export function useAllFeedbackQuery(workspaceSlug: string) {
  return useQuery({
    queryKey: queryKeys.boards.allFeedback(workspaceSlug),
    queryFn: () => fetchAllFeedback(workspaceSlug),
  })
}

export function useAllFeedbackPostsInfiniteQuery(args: {
  workspaceSlug: string
  sort: SortOption
  search: string
}) {
  return useInfiniteQuery({
    queryKey: queryKeys.boards.allFeedbackPosts(
      args.workspaceSlug,
      args.sort,
      args.search,
    ),
    queryFn: ({ pageParam }) =>
      fetchAllFeedbackPosts({
        workspaceSlug: args.workspaceSlug,
        cursor: pageParam,
        sort: args.sort,
        search: args.search,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}
