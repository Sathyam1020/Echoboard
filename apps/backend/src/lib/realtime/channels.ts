// Channel-name builders + auth predicates for the support-chat realtime
// surface. Every WebSocket subscribe is checked against these predicates
// so a customer can't listen on a workspace channel and an admin can't
// listen on a different workspace's channel.
//
// Channel taxonomy (matches phase-3 plan):
//   support:workspace:<wid>     admin-side workspace fan-out
//   support:conversation:<cid>  both parties of a single thread
//   support:user:<uid>          user-scoped events (assignments)
//   support:visitor:<vid>       visitor-scoped events (admin reply pings)
//   support:presence:<wid>      presence updates (phase 6)

import { and, db, eq } from "@workspace/db/client"
import { conversation, workspaceMember } from "@workspace/db/schema"

export type Actor =
  | { kind: "user"; userId: string }
  | { kind: "visitor"; visitorId: string }

export const channelFor = {
  workspace: (workspaceId: string) => `support:workspace:${workspaceId}`,
  conversation: (conversationId: string) =>
    `support:conversation:${conversationId}`,
  user: (userId: string) => `support:user:${userId}`,
  visitor: (visitorId: string) => `support:visitor:${visitorId}`,
  presence: (workspaceId: string) => `support:presence:${workspaceId}`,
}

export type ParsedChannel =
  | { kind: "workspace"; workspaceId: string }
  | { kind: "conversation"; conversationId: string }
  | { kind: "user"; userId: string }
  | { kind: "visitor"; visitorId: string }
  | { kind: "presence"; workspaceId: string }
  | null

const SUPPORT_PREFIX = "support:"

export function parseChannel(name: string): ParsedChannel {
  if (!name.startsWith(SUPPORT_PREFIX)) return null
  const rest = name.slice(SUPPORT_PREFIX.length)
  const sep = rest.indexOf(":")
  if (sep < 0) return null
  const tag = rest.slice(0, sep)
  const id = rest.slice(sep + 1)
  if (!id) return null
  switch (tag) {
    case "workspace":
      return { kind: "workspace", workspaceId: id }
    case "conversation":
      return { kind: "conversation", conversationId: id }
    case "user":
      return { kind: "user", userId: id }
    case "visitor":
      return { kind: "visitor", visitorId: id }
    case "presence":
      return { kind: "presence", workspaceId: id }
    default:
      return null
  }
}

// Decides whether the connecting actor is allowed to subscribe to a
// given channel. Reads workspace_member / conversation rows on demand —
// callers should batch-validate channels per upgrade rather than calling
// this per-event.
export async function canSubscribe(
  actor: Actor,
  channel: ParsedChannel,
): Promise<boolean> {
  if (!channel) return false
  switch (channel.kind) {
    case "workspace":
    case "presence":
      // Workspace + presence channels: any role member of that workspace.
      return (
        actor.kind === "user" &&
        (await isWorkspaceMember(actor.userId, channel.workspaceId))
      )
    case "user":
      return actor.kind === "user" && actor.userId === channel.userId
    case "visitor":
      return actor.kind === "visitor" && actor.visitorId === channel.visitorId
    case "conversation": {
      const conv = await loadConversation(channel.conversationId)
      if (!conv) return false
      if (actor.kind === "visitor")
        return conv.customerVisitorId === actor.visitorId
      // User-side: customer-as-user OR a member of the conversation's workspace.
      if (conv.customerUserId === actor.userId) return true
      return await isWorkspaceMember(actor.userId, conv.workspaceId)
    }
  }
}

async function isWorkspaceMember(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: workspaceMember.id })
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.userId, userId),
        eq(workspaceMember.workspaceId, workspaceId),
      ),
    )
  return row != null
}

async function loadConversation(conversationId: string) {
  const [row] = await db
    .select({
      workspaceId: conversation.workspaceId,
      customerUserId: conversation.customerUserId,
      customerVisitorId: conversation.customerVisitorId,
    })
    .from(conversation)
    .where(eq(conversation.id, conversationId))
  return row ?? null
}
