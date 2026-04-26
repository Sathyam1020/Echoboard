import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { Metadata } from "next"

import { AdminSupportContent } from "@/components/support/admin-support-content"
import { ApiError } from "@/lib/http/api-error"
import { queryKeys } from "@/lib/query/keys"
import { makeQueryClient } from "@/lib/query/query-client"
import {
  fetchSupportConversationSSR,
  fetchSupportConversationsSSR,
  fetchSupportMessagesSSR,
} from "@/services/support.server"

export const metadata: Metadata = {
  title: "Inbox",
  robots: { index: false, follow: false },
}

export default async function SupportConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const queryClient = makeQueryClient()

  // Best-effort SSR prefetch. If the conversation 404s/403s (the user
  // followed a stale link) we let the client surface the error rather
  // than crashing the page.
  const [list, conv, messages] = await Promise.allSettled([
    fetchSupportConversationsSSR(),
    fetchSupportConversationSSR(conversationId),
    fetchSupportMessagesSSR(conversationId),
  ])

  if (list.status === "fulfilled") {
    queryClient.setQueryData(queryKeys.support.conversations({}), {
      pages: [list.value],
      pageParams: [null],
    })
  }
  if (conv.status === "fulfilled") {
    queryClient.setQueryData(
      queryKeys.support.conversation(conversationId),
      conv.value,
    )
  } else if (
    conv.reason instanceof ApiError &&
    (conv.reason.status === 404 || conv.reason.status === 403)
  ) {
    // Ignore — the client thread component will refetch + render its
    // own error state (or empty thread skeleton).
  }
  if (messages.status === "fulfilled") {
    queryClient.setQueryData(queryKeys.support.messages(conversationId), {
      pages: [messages.value],
      pageParams: [null],
    })
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminSupportContent initialConversationId={conversationId} />
    </HydrationBoundary>
  )
}
