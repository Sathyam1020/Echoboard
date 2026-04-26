import { httpClient } from "@/lib/http/axios-client"

import type {
  ConversationStatus,
  SupportConversationRow,
  SupportConversationsPage,
  SupportMessageRow,
  SupportMessagesPage,
  SupportSearchHit,
} from "@/components/support/types"

export type ConversationsListResponse = SupportConversationsPage

export async function fetchSupportConversations(params: {
  status?: ConversationStatus
  assignedToMe?: boolean
  cursor?: string | null
}): Promise<ConversationsListResponse> {
  const { data } = await httpClient.get<ConversationsListResponse>(
    "/api/support/conversations",
    {
      params: {
        status: params.status ?? undefined,
        assignedToMe: params.assignedToMe ? "true" : undefined,
        cursor: params.cursor ?? undefined,
      },
    },
  )
  return data
}

export async function fetchSupportConversation(
  id: string,
): Promise<{ conversation: SupportConversationRow }> {
  const { data } = await httpClient.get<{
    conversation: SupportConversationRow
  }>(`/api/support/conversations/${id}`)
  return data
}

export async function fetchSupportMessages(params: {
  conversationId: string
  cursor?: string | null
}): Promise<SupportMessagesPage> {
  const { data } = await httpClient.get<SupportMessagesPage>(
    `/api/support/conversations/${params.conversationId}/messages`,
    { params: { cursor: params.cursor ?? undefined } },
  )
  return data
}

export async function startSupportConversation(body: {
  workspaceSlug: string
}): Promise<{ conversation: SupportConversationRow }> {
  const { data } = await httpClient.post<{
    conversation: SupportConversationRow
  }>("/api/support/conversations", body)
  return data
}

export async function sendSupportMessage(params: {
  conversationId: string
  body: string
}): Promise<{ message: SupportMessageRow }> {
  const { data } = await httpClient.post<{ message: SupportMessageRow }>(
    `/api/support/conversations/${params.conversationId}/messages`,
    { body: params.body },
  )
  return data
}

export async function markConversationRead(params: {
  conversationId: string
  upToMessageId: string
}): Promise<void> {
  await httpClient.post(
    `/api/support/conversations/${params.conversationId}/read`,
    { upToMessageId: params.upToMessageId },
  )
}

export async function setConversationStatus(params: {
  conversationId: string
  status: ConversationStatus
}): Promise<void> {
  await httpClient.post(
    `/api/support/conversations/${params.conversationId}/status`,
    { status: params.status },
  )
}

export async function setConversationAssignee(params: {
  conversationId: string
  userId: string | null
}): Promise<void> {
  await httpClient.post(
    `/api/support/conversations/${params.conversationId}/assign`,
    { userId: params.userId },
  )
}

export type SearchResponse = { hits: SupportSearchHit[] }

export async function searchSupport(q: string): Promise<SearchResponse> {
  const { data } = await httpClient.get<SearchResponse>("/api/support/search", {
    params: { q },
  })
  return data
}

export async function fetchMyConversation(params: {
  workspaceSlug: string
}): Promise<{ conversation: SupportConversationRow | null }> {
  const { data } = await httpClient.get<{
    conversation: SupportConversationRow | null
  }>("/api/support/me/conversation", {
    params: { workspaceSlug: params.workspaceSlug },
  })
  return data
}

export async function fetchSupportWidgetConfig(
  boardId: string,
): Promise<{ supportEnabled: boolean }> {
  const { data } = await httpClient.get<{ supportEnabled: boolean }>(
    "/api/support/widget-config",
    { params: { boardId } },
  )
  return data
}
