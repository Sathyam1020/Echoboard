// Wire-format serializers for the support-chat surface. Every REST
// response and every WebSocket payload routes through these so the
// frontend types in apps/web/components/support/types.ts stay coherent
// with what the server actually emits.

import type {
  conversation as conversationTable,
  supportMessage as supportMessageTable,
} from "@workspace/db/schema"

export type SupportActor = {
  id: string
  name: string
  kind: "user" | "visitor"
  image: string | null
}

export type SupportMessageRow = {
  id: string
  conversationId: string
  body: string
  createdAt: string
  readAt: string | null
  deliveredAt: string | null
  author: SupportActor
}

export type ConversationStatus = "open" | "pending" | "resolved"

export type SupportConversationRow = {
  id: string
  workspaceId: string
  customer: SupportActor
  status: ConversationStatus
  assignedTo: { id: string; name: string; image: string | null } | null
  unreadAdmin: number
  unreadCustomer: number
  lastMessageAt: string
  lastMessage: {
    body: string
    authorKind: "user" | "visitor"
    createdAt: string
  } | null
  createdAt: string
}

type MessageRow = typeof supportMessageTable.$inferSelect

export type AuthorJoin = {
  userId: string | null
  userName: string | null
  userImage: string | null
  visitorId: string | null
  visitorName: string | null
  visitorAvatar: string | null
}

export function serializeMessage(
  msg: MessageRow,
  author: AuthorJoin,
): SupportMessageRow {
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    body: msg.body,
    createdAt: msg.createdAt.toISOString(),
    readAt: msg.readAt?.toISOString() ?? null,
    deliveredAt: msg.deliveredAt?.toISOString() ?? null,
    author: resolveActor(author, msg.authorUserId, msg.authorVisitorId),
  }
}

type ConversationRow = typeof conversationTable.$inferSelect

export type ConversationJoinExtras = {
  customer: AuthorJoin
  // Latest message preview (optional).
  lastMessage: {
    body: string
    createdAt: Date
    authorUserId: string | null
    authorVisitorId: string | null
  } | null
  assignee: { id: string; name: string; image: string | null } | null
}

export function serializeConversation(
  conv: ConversationRow,
  extras: ConversationJoinExtras,
): SupportConversationRow {
  return {
    id: conv.id,
    workspaceId: conv.workspaceId,
    customer: resolveActor(
      extras.customer,
      conv.customerUserId,
      conv.customerVisitorId,
    ),
    status: conv.status,
    assignedTo: extras.assignee,
    unreadAdmin: conv.unreadAdmin,
    unreadCustomer: conv.unreadCustomer,
    lastMessageAt: conv.lastMessageAt.toISOString(),
    lastMessage: extras.lastMessage
      ? {
          body: extras.lastMessage.body,
          authorKind: extras.lastMessage.authorUserId ? "user" : "visitor",
          createdAt: extras.lastMessage.createdAt.toISOString(),
        }
      : null,
    createdAt: conv.createdAt.toISOString(),
  }
}

// Resolves the joined user / visitor row into a SupportActor. Returns
// a "Deleted user" placeholder when the join misses (FK was set to null
// because the user/visitor was removed but the row was retained).
function resolveActor(
  author: AuthorJoin,
  authorUserId: string | null,
  authorVisitorId: string | null,
): SupportActor {
  if (authorUserId && author.userId === authorUserId) {
    return {
      id: author.userId,
      name: author.userName ?? "Unknown",
      kind: "user",
      image: author.userImage ?? null,
    }
  }
  if (authorVisitorId && author.visitorId === authorVisitorId) {
    return {
      id: author.visitorId,
      name: author.visitorName ?? "Visitor",
      kind: "visitor",
      image: author.visitorAvatar ?? null,
    }
  }
  return {
    id: authorUserId ?? authorVisitorId ?? "",
    name: "Deleted user",
    kind: authorUserId ? "user" : "visitor",
    image: null,
  }
}
