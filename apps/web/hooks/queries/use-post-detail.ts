"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import { fetchPostDetail } from "@/services/posts"

export function usePostDetailQuery(postId: string) {
  return useQuery({
    queryKey: queryKeys.posts.detail(postId),
    queryFn: () => fetchPostDetail(postId),
  })
}
