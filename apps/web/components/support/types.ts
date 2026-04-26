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

export type SupportMessagesPage = {
  messages: SupportMessageRow[]
  // Older-than cursor — null when there are no older messages.
  nextCursor: string | null
}

export type SupportConversationsPage = {
  conversations: SupportConversationRow[]
  nextCursor: string | null
}

export type SupportSearchHit = {
  message: SupportMessageRow
  conversation: { id: string; customer: SupportActor }
  // ts_headline output with the matched terms wrapped.
  highlight: string
}
