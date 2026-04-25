"use client"

import { useInfiniteQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import { fetchBoardPosts, type SortOption } from "@/services/boards"

// Paginated public board feed via cursor-based useInfiniteQuery. The
// `sort` and `search` args are baked into the query key so toggling
// either resets the cache (server can't paginate consistently across
// sort changes — different ORDER BY = different cursor space).
export function useBoardPostsInfiniteQuery(args: {
  workspaceSlug: string
  boardSlug: string
  sort: SortOption
  search: string
}) {
  return useInfiniteQuery({
    queryKey: queryKeys.boards.bySlugPosts(
      args.workspaceSlug,
      args.boardSlug,
      args.sort,
      args.search,
    ),
    queryFn: ({ pageParam }) =>
      fetchBoardPosts({
        workspaceSlug: args.workspaceSlug,
        boardSlug: args.boardSlug,
        cursor: pageParam,
        sort: args.sort,
        search: args.search,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}
