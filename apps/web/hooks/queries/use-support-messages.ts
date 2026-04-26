"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import {
  fetchSupportConversation,
  fetchSupportMessages,
} from "@/services/support"

export function useSupportConversationQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.support.conversation(id ?? ""),
    queryFn: () => fetchSupportConversation(id!),
    enabled: !!id,
    staleTime: 10 * 1000,
  })
}

// Older-than cursor pagination: page 0 = latest 20 in chronological
// order; subsequent pages prepend OLDER messages. The thread component
// reads the merged stream — Phase 4's UI plumbs scroll-up to fetchNext.
export function useSupportMessagesInfiniteQuery(conversationId: string | null) {
  return useInfiniteQuery({
    queryKey: queryKeys.support.messages(conversationId ?? ""),
    enabled: !!conversationId,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchSupportMessages({
        conversationId: conversationId!,
        cursor: pageParam,
      }),
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 10 * 1000,
  })
}
