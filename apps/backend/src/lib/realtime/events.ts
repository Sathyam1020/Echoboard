// Wire-format for the support realtime channel. Inbound messages are
// what the client sends to the server; outbound are what the server
// emits to subscribers. The server publishes outbound shapes through
// redis-bus; the WebSocket gateway forwards them to connected sockets.

import type {
  SupportConversationRow,
  SupportMessageRow,
} from "./serialize.js"

// ── Inbound (client → server) ─────────────────────────────────────

export type ClientMsg =
  | { type: "subscribe"; channels: string[] }
  | { type: "unsubscribe"; channels: string[] }
  | { type: "ping" }
  | { type: "typing"; conversationId: string; isTyping: boolean }
  | { type: "presence"; status: "online" | "away" }

// ── Outbound (server → client) ────────────────────────────────────

export type ServerMsg =
  | { type: "pong" }
  | {
      type: "subscribed"
      channel: string
    }
  | {
      type: "subscribe-error"
      channel: string
      reason: "forbidden" | "invalid-channel"
    }
  | {
      type: "message.created"
      conversationId: string
      message: SupportMessageRow
    }
  | {
      type: "message.read"
      conversationId: string
      readByKind: "admin" | "customer"
      readUpToMessageId: string
    }
  | {
      type: "conversation.created"
      conversation: SupportConversationRow
    }
  | {
      type: "conversation.updated"
      conversationId: string
      patch: Partial<SupportConversationRow>
    }
  | {
      type: "conversation.assigned"
      conversationId: string
      assignedTo: { id: string; name: string; image: string | null } | null
    }
  | {
      type: "typing"
      conversationId: string
      actorId: string
      actorKind: "user" | "visitor"
      isTyping: boolean
    }
  | {
      type: "presence"
      userId: string
      status: "online" | "away" | "offline"
    }
