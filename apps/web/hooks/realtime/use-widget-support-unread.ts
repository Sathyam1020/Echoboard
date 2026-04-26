"use client"

import { useEffect, useState } from "react"

import { widgetHttp } from "@/lib/http/widget-axios"
import {
  subscribe,
  type ServerMsg,
} from "@/lib/realtime/socket-client"

import type { SupportConversationRow } from "@/components/support/types"
import type { SupportMessageRow } from "@/components/support/types"

// Tracks unread admin messages for the widget's Support tab pill so the
// visitor sees a badge when an admin replies while they're on a
// different tab. Lives in WidgetUI (not the thread) so it persists
// across tab switches; the thread's own subscription stays focused on
// rendering messages.
//
// `clear()` is called by the Support tab on mount/focus to zero the
// counter — the thread will mark-as-read on the server side, this
// just resets the local indicator.
export function useWidgetSupportUnread({
  workspaceSlug,
  enabled,
  visitorId,
}: {
  workspaceSlug: string
  enabled: boolean
  visitorId: string | null
}): { unread: number; clear: () => void } {
  const [unread, setUnread] = useState(0)
  const [conversationId, setConversationId] = useState<string | null>(null)

  // Bootstrap: pull "my" conversation in this workspace so we know the
  // channel to subscribe on. Re-runs when the visitor identity changes
  // (after the StarterCard guest-signup flow).
  useEffect(() => {
    let cancelled = false
    if (!enabled || !visitorId) {
      setConversationId(null)
      return
    }
    widgetHttp
      .get<{ conversation: SupportConversationRow | null }>(
        "/api/support/me/conversation",
        { params: { workspaceSlug } },
      )
      .then((r) => {
        if (cancelled) return
        setConversationId(r.data.conversation?.id ?? null)
        setUnread(r.data.conversation?.unreadCustomer ?? 0)
      })
      .catch(() => {
        if (!cancelled) setConversationId(null)
      })
    return () => {
      cancelled = true
    }
  }, [enabled, visitorId, workspaceSlug])

  // Live updates — admin replies bump the counter, mark-read events
  // (admin reading our messages) don't. Self-authored messages don't
  // bump either.
  useEffect(() => {
    if (!enabled || !conversationId) return
    return subscribe(
      `support:conversation:${conversationId}`,
      (event: ServerMsg) => {
        if (event.type !== "message.created") return
        const msg = (event as unknown as { message: SupportMessageRow })
          .message
        if (msg.author.kind !== "user") return
        setUnread((n) => n + 1)
      },
    )
  }, [enabled, conversationId])

  return {
    unread,
    clear: () => setUnread(0),
  }
}
