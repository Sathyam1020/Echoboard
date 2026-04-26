import "server-only"

import { serverHttp } from "@/lib/http/server-axios"

import type {
  SupportConversationRow,
  SupportConversationsPage,
  SupportMessagesPage,
} from "@/components/support/types"

export function fetchSupportConversationsSSR(): Promise<SupportConversationsPage> {
  return serverHttp.get<SupportConversationsPage>(
    "/api/support/conversations",
  )
}

export function fetchSupportConversationSSR(
  id: string,
): Promise<{ conversation: SupportConversationRow }> {
  return serverHttp.get<{ conversation: SupportConversationRow }>(
    `/api/support/conversations/${id}`,
  )
}

export function fetchSupportMessagesSSR(
  conversationId: string,
): Promise<SupportMessagesPage> {
  return serverHttp.get<SupportMessagesPage>(
    `/api/support/conversations/${conversationId}/messages`,
  )
}
