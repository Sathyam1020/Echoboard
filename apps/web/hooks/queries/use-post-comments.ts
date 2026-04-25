"use client"

import { useInfiniteQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import { fetchPostComments } from "@/services/posts"

export function usePostCommentsInfiniteQuery(postId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.comments.byPost(postId),
    queryFn: ({ pageParam }) =>
      fetchPostComments({ postId, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}
