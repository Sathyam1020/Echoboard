"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { ApiError } from "@/lib/http/api-error"
import { queryKeys } from "@/lib/query/keys"
import {
  markConversationRead,
  sendSupportMessage,
  setConversationAssignee,
  setConversationStatus,
} from "@/services/support"

import type {
  ConversationStatus,
  SupportConversationRow,
  SupportMessageRow,
  SupportMessagesPage,
} from "@/components/support/types"

function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message
  return fallback
}

type MessagesCache = {
  pages: SupportMessagesPage[]
  pageParams: unknown[]
}

// Send-message mutation. Optimistic-appends the message to the first
// page so the UI reflects it immediately; the WebSocket dedupes on id
// when the real broadcast arrives.
export function useSendSupportMessageMutation(conversationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => sendSupportMessage({ conversationId, body }),
    onSuccess: ({ message }) => {
      qc.setQueryData<MessagesCache>(
        queryKeys.support.messages(conversationId),
        (data) => {
          if (!data) return data
          const [first, ...rest] = data.pages
          if (!first) return data
          if (first.messages.some((m) => m.id === message.id)) return data
          return {
            ...data,
            pages: [
              { ...first, messages: [...first.messages, message] },
              ...rest,
            ],
          }
        },
      )
    },
    onError: (err) => toast.error(describeError(err, "Couldn't send message")),
  })
}

// Mark-as-read. Fire-and-forget (no toast on success — it's silent).
export function useMarkConversationReadMutation(conversationId: string) {
  return useMutation({
    mutationFn: (upToMessageId: string) =>
      markConversationRead({ conversationId, upToMessageId }),
    onError: () => {
      // Silently ignore — marking-as-read is best-effort. The WS
      // event will retry eventually if the user lingers.
    },
  })
}

export function useSetConversationStatusMutation(
  conversationId: string,
  workspaceId: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: ConversationStatus) =>
      setConversationStatus({ conversationId, status }),
    onSuccess: (_void, status) => {
      qc.setQueryData<{ conversation: SupportConversationRow } | undefined>(
        queryKeys.support.conversation(conversationId),
        (data) =>
          data
            ? { conversation: { ...data.conversation, status } }
            : data,
      )
      // The WS broadcast handles list-cache patches across all filter
      // combos for us. We only refresh local detail.
      void workspaceId
      toast.success(
        status === "resolved"
          ? "Marked resolved"
          : status === "open"
            ? "Re-opened"
            : "Marked pending",
      )
    },
    onError: (err) =>
      toast.error(describeError(err, "Couldn't change status")),
  })
}

export function useSetConversationAssigneeMutation(
  conversationId: string,
  workspaceId: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
    }: {
      userId: string | null
      // Caller passes assignee row so we can patch the cache without a
      // round-trip while waiting for the WS event.
      assignee: SupportConversationRow["assignedTo"]
    }) => setConversationAssignee({ conversationId, userId }),
    onSuccess: (_void, vars) => {
      qc.setQueryData<{ conversation: SupportConversationRow } | undefined>(
        queryKeys.support.conversation(conversationId),
        (data) =>
          data
            ? {
                conversation: {
                  ...data.conversation,
                  assignedTo: vars.assignee,
                },
              }
            : data,
      )
      void workspaceId
      toast.success(vars.userId ? "Assigned" : "Unassigned")
    },
    onError: (err) => toast.error(describeError(err, "Couldn't assign")),
  })
}
