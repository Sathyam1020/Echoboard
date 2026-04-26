"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { queryKeys } from "@/lib/query/keys"
import { subscribe } from "@/lib/realtime/socket-client"
import type { ServerMsg } from "@/lib/realtime/socket-client"
import { playSupportChime } from "@/lib/support-sound"

import type {
  SupportConversationRow,
  SupportConversationsPage,
  SupportMessageRow,
  SupportMessagesPage,
} from "@/components/support/types"

type Filter = {
  status?: "open" | "pending" | "resolved"
  mine?: boolean
}

// Mounts the WebSocket subscriptions an admin support page needs and
// patches React Query caches as events arrive. The component owns
// the subscription lifecycle — unmount cleans up. Multiple components
// mounting this hook share one underlying WebSocket via the singleton
// in lib/realtime/socket-client.ts.
export function useSupportSocket({
  workspaceId,
  conversationId,
  filter,
}: {
  workspaceId: string
  conversationId?: string | null
  filter?: Filter
}): void {
  const qc = useQueryClient()

  // Workspace channel — list-level events.
  useEffect(() => {
    if (!workspaceId) return
    return subscribe(
      `support:workspace:${workspaceId}`,
      (event: ServerMsg) => {
        if (event.type === "conversation.created") {
          const conv = event.conversation as SupportConversationRow
          patchConversationsList(qc, (page) => ({
            ...page,
            conversations: dedupePrepend(page.conversations, conv),
          }))
        } else if (event.type === "conversation.updated") {
          const id = event.conversationId as string
          const patch = event.patch as Partial<SupportConversationRow>
          patchConversationsList(qc, (page) => ({
            ...page,
            conversations: applyPatch(page.conversations, id, patch),
          }))
          // Chime on every visitor-authored message — matches Slack /
          // WhatsApp / iMessage behavior of dinging even when the
          // conversation is already open. Status-only patches skip
          // (only fire when the patch actually carried a fresh msg).
          // The mute toggle is the user's escape valve.
          const lastMsg = patch.lastMessage
          if (lastMsg && lastMsg.authorKind === "visitor") {
            playSupportChime()
          }
        } else if (event.type === "conversation.assigned") {
          const id = event.conversationId as string
          const assignedTo = event.assignedTo as
            | { id: string; name: string; image: string | null }
            | null
          patchConversationsList(qc, (page) => ({
            ...page,
            conversations: applyPatch(page.conversations, id, { assignedTo }),
          }))
        }
      },
    )
  }, [workspaceId, qc, conversationId])

  // Conversation channel — message + read events for the active thread.
  useEffect(() => {
    if (!conversationId) return
    return subscribe(
      `support:conversation:${conversationId}`,
      (event: ServerMsg) => {
        if (event.type === "message.created") {
          const msg = event.message as SupportMessageRow
          appendMessage(qc, conversationId, msg)
        } else if (event.type === "message.read") {
          const upToId = event.readUpToMessageId as string
          const readByKind = event.readByKind as "admin" | "customer"
          markRead(qc, conversationId, upToId, readByKind)
        }
      },
    )
  }, [conversationId, qc])
}

// ── Cache mutators ────────────────────────────────────────────────

type ConversationsInfiniteData = {
  pages: SupportConversationsPage[]
  pageParams: unknown[]
}

// Patch every conversation-list cache (across every filter combo) that
// has the updated conversation. Using setQueriesData with a prefix key
// match means a status-change broadcast updates the row whether the
// user is on All / Open / Pending / Resolved / Mine. Without this the
// non-active filters stayed stale until the user switched to them.
function patchConversationsList(
  qc: ReturnType<typeof useQueryClient>,
  patcher: (page: SupportConversationsPage) => SupportConversationsPage,
): void {
  qc.setQueriesData<ConversationsInfiniteData>(
    { queryKey: ["support", "conversations"] },
    (data) => {
      if (!data) return data
      return {
        ...data,
        pages: data.pages.map((p, i) => (i === 0 ? patcher(p) : p)),
      }
    },
  )
}

function dedupePrepend(
  list: SupportConversationRow[],
  next: SupportConversationRow,
): SupportConversationRow[] {
  const filtered = list.filter((c) => c.id !== next.id)
  return [next, ...filtered]
}

function applyPatch(
  list: SupportConversationRow[],
  id: string,
  patch: Partial<SupportConversationRow>,
): SupportConversationRow[] {
  return list
    .map((c) => (c.id === id ? { ...c, ...patch } : c))
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime(),
    )
}

type MessagesInfiniteData = {
  pages: SupportMessagesPage[]
  pageParams: unknown[]
}

function appendMessage(
  qc: ReturnType<typeof useQueryClient>,
  conversationId: string,
  message: SupportMessageRow,
): void {
  const key = queryKeys.support.messages(conversationId)
  qc.setQueryData<MessagesInfiniteData>(key, (data) => {
    if (!data) return data
    // Newest messages live at the END of the FIRST page (we paginate
    // older-than, so page 0 = latest 20 in chronological order).
    const [first, ...rest] = data.pages
    if (!first) return data
    if (first.messages.some((m) => m.id === message.id)) return data
    return {
      ...data,
      pages: [{ ...first, messages: [...first.messages, message] }, ...rest],
    }
  })
}

function markRead(
  qc: ReturnType<typeof useQueryClient>,
  conversationId: string,
  upToMessageId: string,
  readByKind: "admin" | "customer",
): void {
  const key = queryKeys.support.messages(conversationId)
  qc.setQueryData<MessagesInfiniteData>(key, (data) => {
    if (!data) return data
    // Find the timestamp of the upTo message; everything authored by
    // the OTHER party (relative to who marked read) at or before that
    // gets readAt stamped. We only know the message id, not its time —
    // walk pages to find it.
    let upToCreatedAt: string | null = null
    for (const page of data.pages) {
      const m = page.messages.find((x) => x.id === upToMessageId)
      if (m) {
        upToCreatedAt = m.createdAt
        break
      }
    }
    if (!upToCreatedAt) return data
    const otherKind = readByKind === "admin" ? "visitor" : "user"
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        messages: page.messages.map((m) => {
          if (m.readAt) return m
          if (m.author.kind !== otherKind) return m
          if (m.createdAt > (upToCreatedAt as string)) return m
          return { ...m, readAt: new Date().toISOString() }
        }),
      })),
    }
  })
}
