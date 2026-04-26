"use client"

import { useInfiniteQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import { fetchSupportConversations } from "@/services/support"

import type { ConversationStatus } from "@/components/support/types"

export function useSupportConversationsInfiniteQuery(filter: {
  status?: ConversationStatus
  mine?: boolean
}) {
  return useInfiniteQuery({
    queryKey: queryKeys.support.conversations(filter),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchSupportConversations({
        status: filter.status,
        assignedToMe: filter.mine,
        cursor: pageParam,
      }),
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 10 * 1000,
  })
}
