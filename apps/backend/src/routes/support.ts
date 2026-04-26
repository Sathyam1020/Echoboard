import { randomUUID } from "node:crypto"

import {
  and,
  asc,
  db,
  desc,
  eq,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
} from "@workspace/db/client"
import {
  board,
  conversation,
  conversationAuditLog,
  supportMessage,
  user,
  visitor,
  workspace,
  workspaceMember,
} from "@workspace/db/schema"
import { Router, type Request, type Response } from "express"
import { z } from "zod"

import {
  decodeCursor,
  encodeCursor,
  isSupportConversationsCursor,
  isSupportMessagesCursor,
  PAGE_SIZE,
} from "../lib/cursor.js"
import { channelFor } from "../lib/realtime/channels.js"
import { publish } from "../lib/realtime/redis-bus.js"
import {
  serializeConversation,
  serializeMessage,
  type AuthorJoin,
} from "../lib/realtime/serialize.js"
import { loadVisitorBySession } from "../lib/visitor-session.js"
import {
  getMemberRole,
  isAtLeastRole,
  requireWorkspaceMember,
  type WorkspaceRole,
} from "../lib/workspace-context.js"
import { AppError } from "../middleware/error-handler.js"
import { requireAnyAuth } from "../middleware/require-any-auth.js"
import { requireAuth } from "../middleware/require-auth.js"
import { readVisitorToken } from "../middleware/require-visitor.js"

export const supportRouter: Router = Router()

const MAX_BODY = 4000

// ── Actor resolution ──────────────────────────────────────────────
// The same conversation endpoints serve both the admin (Better Auth
// session) and the customer (visitor session). We resolve whichever
// auth is present and reject when neither is.

type ResolvedActor =
  | {
      kind: "user"
      userId: string
      userName: string
      userImage: string | null
    }
  | {
      kind: "visitor"
      visitorId: string
      workspaceId: string
      visitorName: string | null
      visitorAvatar: string | null
    }

async function resolveActor(req: Request): Promise<ResolvedActor | null> {
  const session = (req.res?.locals.session as
    | { user: { id: string; name: string; image?: string | null } }
    | undefined) ?? undefined
  if (session?.user?.id) {
    return {
      kind: "user",
      userId: session.user.id,
      userName: session.user.name,
      userImage: session.user.image ?? null,
    }
  }
  const token = readVisitorToken(req)
  if (token) {
    const v = await loadVisitorBySession(token)
    if (v) {
      return {
        kind: "visitor",
        visitorId: v.visitor.id,
        workspaceId: v.visitor.workspaceId,
        visitorName: v.visitor.name,
        visitorAvatar: v.visitor.avatarUrl,
      }
    }
  }
  return null
}

// Returns the conversation row + a quick "can this actor talk in this
// thread?" verdict. 404s for missing, 403s for unauthorised.
async function loadConversationFor(
  conversationId: string,
  actor: ResolvedActor,
): Promise<{
  conv: typeof conversation.$inferSelect
  role: "admin" | "customer"
  workspaceRole: WorkspaceRole | null
}> {
  const [conv] = await db
    .select()
    .from(conversation)
    .where(eq(conversation.id, conversationId))
  if (!conv) {
    throw new AppError("Conversation not found", {
      status: 404,
      code: "CONVERSATION_NOT_FOUND",
    })
  }
  if (actor.kind === "visitor") {
    if (conv.customerVisitorId !== actor.visitorId) {
      throw new AppError("Not authorised", { status: 403, code: "FORBIDDEN" })
    }
    return { conv, role: "customer", workspaceRole: null }
  }
  // user actor — could be the conversation's customer (rare, when the
  // customer has an echoboard account) OR a workspace admin.
  if (conv.customerUserId === actor.userId) {
    return { conv, role: "customer", workspaceRole: null }
  }
  const role = await getMemberRole(actor.userId, conv.workspaceId)
  if (!role) {
    throw new AppError("Not authorised", { status: 403, code: "FORBIDDEN" })
  }
  return { conv, role: "admin", workspaceRole: role }
}

// ── Conversations list (admin) ────────────────────────────────────

const listQuery = z.object({
  status: z.enum(["open", "pending", "resolved"]).optional(),
  assignedToMe: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v === "true"),
  cursor: z.string().optional(),
})

supportRouter.get(
  "/conversations",
  requireAuth,
  requireWorkspaceMember(),
  async (req: Request, res: Response) => {
    const ctx = res.locals.workspaceContext!
    const session = res.locals.session!
    const parsed = listQuery.safeParse(req.query)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid query", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }

    const cursor = decodeCursor(
      parsed.data.cursor ?? null,
      isSupportConversationsCursor,
    )
    const limit = PAGE_SIZE.supportConversations

    const cursorWhere = cursor
      ? or(
          lt(conversation.lastMessageAt, new Date(cursor.lm)),
          and(
            eq(conversation.lastMessageAt, new Date(cursor.lm)),
            lt(conversation.id, cursor.id),
          ),
        )
      : undefined

    // Aliasing the same `user` table twice (customer + assignee) needs
    // explicit aliases; we read assignee separately to keep the query
    // legible.
    const rows = await db
      .select({
        conv: conversation,
        customerUserName: user.name,
        customerUserImage: user.image,
        customerVisitorName: visitor.name,
        customerVisitorAvatar: visitor.avatarUrl,
      })
      .from(conversation)
      .leftJoin(user, eq(user.id, conversation.customerUserId))
      .leftJoin(visitor, eq(visitor.id, conversation.customerVisitorId))
      .where(
        and(
          eq(conversation.workspaceId, ctx.workspace.id),
          parsed.data.status
            ? eq(conversation.status, parsed.data.status)
            : undefined,
          parsed.data.assignedToMe
            ? eq(conversation.assignedToUserId, session.user.id)
            : undefined,
          cursorWhere,
        ),
      )
      .orderBy(desc(conversation.lastMessageAt), desc(conversation.id))
      .limit(limit + 1)

    const hasNext = rows.length > limit
    const page = hasNext ? rows.slice(0, limit) : rows
    const ids = page.map((r) => r.conv.id)

    // Latest message per conversation in one round-trip.
    const lastMessages = ids.length
      ? await db
          .select({
            conversationId: supportMessage.conversationId,
            body: supportMessage.body,
            createdAt: supportMessage.createdAt,
            authorUserId: supportMessage.authorUserId,
            authorVisitorId: supportMessage.authorVisitorId,
            // Postgres window function: rank messages within each
            // conversation by createdAt DESC, take #1 below in JS.
            rn: sql<number>`row_number() over (partition by ${supportMessage.conversationId} order by ${supportMessage.createdAt} desc)`,
          })
          .from(supportMessage)
          .where(
            sql`${supportMessage.conversationId} = ANY(${sql.raw(`ARRAY['${ids.map((i) => i.replace(/'/g, "''")).join("','")}']::text[]`)})`,
          )
      : []
    const lastByConv = new Map<
      string,
      {
        body: string
        createdAt: Date
        authorUserId: string | null
        authorVisitorId: string | null
      }
    >()
    for (const r of lastMessages) {
      if (r.rn === 1) {
        lastByConv.set(r.conversationId, {
          body: r.body,
          createdAt: r.createdAt,
          authorUserId: r.authorUserId,
          authorVisitorId: r.authorVisitorId,
        })
      }
    }

    // Assignees in one round-trip.
    const assigneeIds = page
      .map((r) => r.conv.assignedToUserId)
      .filter((x): x is string => x != null)
    const assignees = assigneeIds.length
      ? await db
          .select({ id: user.id, name: user.name, image: user.image })
          .from(user)
          .where(
            sql`${user.id} = ANY(${sql.raw(`ARRAY['${assigneeIds.map((i) => i.replace(/'/g, "''")).join("','")}']::text[]`)})`,
          )
      : []
    const assigneeMap = new Map(assignees.map((a) => [a.id, a]))

    const conversations = page.map((r) =>
      serializeConversation(r.conv, {
        customer: {
          userId: r.conv.customerUserId,
          userName: r.customerUserName,
          userImage: r.customerUserImage,
          visitorId: r.conv.customerVisitorId,
          visitorName: r.customerVisitorName,
          visitorAvatar: r.customerVisitorAvatar,
        },
        lastMessage: lastByConv.get(r.conv.id) ?? null,
        assignee: r.conv.assignedToUserId
          ? assigneeMap.get(r.conv.assignedToUserId) ?? null
          : null,
      }),
    )

    let nextCursor: string | null = null
    if (hasNext && page.length > 0) {
      const last = page[page.length - 1]!.conv
      nextCursor = encodeCursor({
        k: "support-convs",
        lm: last.lastMessageAt.toISOString(),
        id: last.id,
      })
    }

    res.json({ conversations, nextCursor })
  },
)

// ── Conversation header (admin OR customer) ──────────────────────

supportRouter.get(
  "/conversations/:id",
  requireAnyAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id
    if (typeof id !== "string" || !id) {
      throw new AppError("Invalid id", { status: 400, code: "VALIDATION_ERROR" })
    }
    const actor = await resolveActor(req)
    if (!actor) {
      throw new AppError("Not signed in", { status: 401, code: "UNAUTHORIZED" })
    }
    const { conv } = await loadConversationFor(id, actor)
    const customer = await loadAuthorJoin(conv.customerUserId, conv.customerVisitorId)
    const assignee = conv.assignedToUserId
      ? await loadAssignee(conv.assignedToUserId)
      : null
    res.json({
      conversation: serializeConversation(conv, {
        customer,
        lastMessage: null,
        assignee,
      }),
    })
  },
)

// ── Conversation messages (paginated, older-than) ────────────────

supportRouter.get(
  "/conversations/:id/messages",
  requireAnyAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id
    if (typeof id !== "string" || !id) {
      throw new AppError("Invalid id", { status: 400, code: "VALIDATION_ERROR" })
    }
    const actor = await resolveActor(req)
    if (!actor) {
      throw new AppError("Not signed in", { status: 401, code: "UNAUTHORIZED" })
    }
    await loadConversationFor(id, actor)

    const cursor = decodeCursor(
      typeof req.query.cursor === "string" ? req.query.cursor : null,
      isSupportMessagesCursor,
    )
    const limit = PAGE_SIZE.supportMessages

    // Older-than cursor: scrolling UP loads older. Initial load (no
    // cursor) gets the latest N.
    const cursorWhere = cursor
      ? or(
          lt(supportMessage.createdAt, new Date(cursor.ca)),
          and(
            eq(supportMessage.createdAt, new Date(cursor.ca)),
            lt(supportMessage.id, cursor.id),
          ),
        )
      : undefined

    const rows = await db
      .select({
        msg: supportMessage,
        userId: user.id,
        userName: user.name,
        userImage: user.image,
        visitorId: visitor.id,
        visitorName: visitor.name,
        visitorAvatar: visitor.avatarUrl,
      })
      .from(supportMessage)
      .leftJoin(user, eq(user.id, supportMessage.authorUserId))
      .leftJoin(visitor, eq(visitor.id, supportMessage.authorVisitorId))
      .where(and(eq(supportMessage.conversationId, id), cursorWhere))
      .orderBy(desc(supportMessage.createdAt), desc(supportMessage.id))
      .limit(limit + 1)

    const hasNext = rows.length > limit
    const page = hasNext ? rows.slice(0, limit) : rows

    // Sort ascending so the client can append in chronological order.
    const messages = page
      .map((r) =>
        serializeMessage(r.msg, {
          userId: r.userId,
          userName: r.userName,
          userImage: r.userImage,
          visitorId: r.visitorId,
          visitorName: r.visitorName,
          visitorAvatar: r.visitorAvatar,
        }),
      )
      .reverse()

    let nextCursor: string | null = null
    if (hasNext && page.length > 0) {
      const oldest = page[page.length - 1]!.msg
      nextCursor = encodeCursor({
        k: "support-msgs",
        ca: oldest.createdAt.toISOString(),
        id: oldest.id,
      })
    }

    res.json({ messages, nextCursor })
  },
)

// ── Start (or get) my conversation in a workspace (customer side) ─

const startBody = z.object({
  workspaceSlug: z.string().min(1),
})

supportRouter.post(
  "/conversations",
  requireAnyAuth,
  async (req: Request, res: Response) => {
    const parsed = startBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid body", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }
    const actor = await resolveActor(req)
    if (!actor) {
      throw new AppError("Not signed in", { status: 401, code: "UNAUTHORIZED" })
    }
    const [ws] = await db
      .select()
      .from(workspace)
      .where(eq(workspace.slug, parsed.data.workspaceSlug))
    if (!ws) {
      throw new AppError("Workspace not found", {
        status: 404,
        code: "WORKSPACE_NOT_FOUND",
      })
    }
    // Visitor must belong to this workspace; user is allowed to start a
    // conversation in any workspace they can reach the widget from.
    if (actor.kind === "visitor" && actor.workspaceId !== ws.id) {
      throw new AppError("Visitor / workspace mismatch", {
        status: 403,
        code: "FORBIDDEN",
      })
    }

    // Idempotent — return the existing open conversation if one exists.
    const customerUserId = actor.kind === "user" ? actor.userId : null
    const customerVisitorId = actor.kind === "visitor" ? actor.visitorId : null
    const [existing] = await db
      .select()
      .from(conversation)
      .where(
        and(
          eq(conversation.workspaceId, ws.id),
          customerUserId
            ? eq(conversation.customerUserId, customerUserId)
            : undefined,
          customerVisitorId
            ? eq(conversation.customerVisitorId, customerVisitorId)
            : undefined,
        ),
      )
    if (existing) {
      const customer = await loadAuthorJoin(
        existing.customerUserId,
        existing.customerVisitorId,
      )
      res.json({
        conversation: serializeConversation(existing, {
          customer,
          lastMessage: null,
          assignee: null,
        }),
      })
      return
    }

    const id = randomUUID()
    await db.insert(conversation).values({
      id,
      workspaceId: ws.id,
      customerUserId,
      customerVisitorId,
      status: "open",
      // last_message_at defaults to now(); creation effectively counts
      // as "activity" for sort-order purposes.
    })
    const [created] = await db
      .select()
      .from(conversation)
      .where(eq(conversation.id, id))
    const customer = await loadAuthorJoin(
      created!.customerUserId,
      created!.customerVisitorId,
    )

    const serialized = serializeConversation(created!, {
      customer,
      lastMessage: null,
      assignee: null,
    })

    // Notify admins of the workspace that a new conversation appeared.
    await publish(channelFor.workspace(ws.id), {
      type: "conversation.created",
      conversation: serialized,
    })

    res.status(201).json({ conversation: serialized })
  },
)

// ── Send message ──────────────────────────────────────────────────

const sendBody = z.object({
  body: z.string().trim().min(1).max(MAX_BODY),
})

supportRouter.post(
  "/conversations/:id/messages",
  requireAnyAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id
    if (typeof id !== "string" || !id) {
      throw new AppError("Invalid id", { status: 400, code: "VALIDATION_ERROR" })
    }
    const parsed = sendBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid body", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }
    const actor = await resolveActor(req)
    if (!actor) {
      throw new AppError("Not signed in", { status: 401, code: "UNAUTHORIZED" })
    }
    const { conv, role } = await loadConversationFor(id, actor)

    const isAdminAuthor = role === "admin"
    const messageId = randomUUID()
    const now = new Date()

    await db.insert(supportMessage).values({
      id: messageId,
      conversationId: id,
      authorUserId: actor.kind === "user" ? actor.userId : null,
      authorVisitorId: actor.kind === "visitor" ? actor.visitorId : null,
      body: parsed.data.body,
      // Server-stamped delivery: simpler than per-recipient ACKs and
      // good enough for the first cut. Phase 6 may flip this to a
      // socket-ack flow if read receipts grow stricter semantics.
      deliveredAt: now,
    })

    // Auto status transition: admin reply on open → pending; customer
    // reply on pending/resolved → open.
    const nextStatus =
      isAdminAuthor && conv.status === "open"
        ? "pending"
        : !isAdminAuthor && conv.status !== "open"
          ? "open"
          : conv.status

    const counterField = isAdminAuthor ? "unreadCustomer" : "unreadAdmin"

    await db
      .update(conversation)
      .set({
        lastMessageAt: sql`now()`,
        status: nextStatus,
        [counterField]: sql`${conversation[counterField]} + 1`,
      })
      .where(eq(conversation.id, id))

    if (nextStatus !== conv.status) {
      await db.insert(conversationAuditLog).values({
        id: randomUUID(),
        conversationId: id,
        action: "status_change",
        fromValue: conv.status,
        toValue: nextStatus,
        actorUserId: actor.kind === "user" ? actor.userId : null,
      })
    }

    const author: AuthorJoin =
      actor.kind === "user"
        ? {
            userId: actor.userId,
            userName: actor.userName,
            userImage: actor.userImage,
            visitorId: null,
            visitorName: null,
            visitorAvatar: null,
          }
        : {
            userId: null,
            userName: null,
            userImage: null,
            visitorId: actor.visitorId,
            visitorName: actor.visitorName,
            visitorAvatar: actor.visitorAvatar,
          }

    const serialized = serializeMessage(
      {
        id: messageId,
        conversationId: id,
        authorUserId: actor.kind === "user" ? actor.userId : null,
        authorVisitorId: actor.kind === "visitor" ? actor.visitorId : null,
        body: parsed.data.body,
        readAt: null,
        deliveredAt: now,
        createdAt: now,
      },
      author,
    )

    // Re-load updated conversation row for the patch event so admin
    // lists rerank correctly.
    const [updated] = await db
      .select()
      .from(conversation)
      .where(eq(conversation.id, id))

    await publish(channelFor.conversation(id), {
      type: "message.created",
      conversationId: id,
      message: serialized,
    })
    if (updated) {
      await publish(channelFor.workspace(conv.workspaceId), {
        type: "conversation.updated",
        conversationId: id,
        patch: {
          lastMessageAt: updated.lastMessageAt.toISOString(),
          unreadAdmin: updated.unreadAdmin,
          unreadCustomer: updated.unreadCustomer,
          status: updated.status,
          // Include the latest message preview so the conversation
          // list row can show "You: …" / "Customer: …" without a
          // separate refetch. Without this the row stays stuck on
          // whatever preview the initial /conversations fetch
          // returned (often null → "No messages yet" copy).
          lastMessage: {
            body: parsed.data.body,
            authorKind: actor.kind,
            createdAt: now.toISOString(),
          },
        },
      })
    }

    res.status(201).json({ message: serialized })
  },
)

// ── Mark read ─────────────────────────────────────────────────────

const readBody = z.object({
  upToMessageId: z.string().min(1),
})

supportRouter.post(
  "/conversations/:id/read",
  requireAnyAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id
    if (typeof id !== "string" || !id) {
      throw new AppError("Invalid id", { status: 400, code: "VALIDATION_ERROR" })
    }
    const parsed = readBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid body", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }
    const actor = await resolveActor(req)
    if (!actor) {
      throw new AppError("Not signed in", { status: 401, code: "UNAUTHORIZED" })
    }
    const { conv, role } = await loadConversationFor(id, actor)

    const isAdmin = role === "admin"
    const counterField = isAdmin ? "unreadAdmin" : "unreadCustomer"

    // Walk forward through the OTHER party's messages up to upToMessageId.
    const [target] = await db
      .select({ createdAt: supportMessage.createdAt })
      .from(supportMessage)
      .where(
        and(
          eq(supportMessage.id, parsed.data.upToMessageId),
          eq(supportMessage.conversationId, id),
        ),
      )
    if (!target) {
      throw new AppError("Message not in conversation", {
        status: 404,
        code: "MESSAGE_NOT_FOUND",
      })
    }

    await db
      .update(supportMessage)
      .set({ readAt: sql`now()` })
      .where(
        and(
          eq(supportMessage.conversationId, id),
          isNull(supportMessage.readAt),
          lt(supportMessage.createdAt, sql`${target.createdAt}::timestamp + interval '1 millisecond'`),
          isAdmin
            ? isNotNull(supportMessage.authorVisitorId)
            : isNotNull(supportMessage.authorUserId),
        ),
      )

    await db
      .update(conversation)
      .set({ [counterField]: 0 })
      .where(eq(conversation.id, id))

    await publish(channelFor.conversation(id), {
      type: "message.read",
      conversationId: id,
      readByKind: isAdmin ? "admin" : "customer",
      readUpToMessageId: parsed.data.upToMessageId,
    })

    res.status(204).send()
    void conv
  },
)

// ── Status (admin) ────────────────────────────────────────────────

const statusBody = z.object({
  status: z.enum(["open", "pending", "resolved"]),
})

supportRouter.post(
  "/conversations/:id/status",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id
    if (typeof id !== "string" || !id) {
      throw new AppError("Invalid id", { status: 400, code: "VALIDATION_ERROR" })
    }
    const parsed = statusBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid body", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }
    const actor = await resolveActor(req)
    if (!actor || actor.kind !== "user") {
      throw new AppError("Admin only", { status: 403, code: "FORBIDDEN" })
    }
    const { conv, role, workspaceRole } = await loadConversationFor(id, actor)
    if (role !== "admin" || !isAtLeastRole(workspaceRole, "admin")) {
      throw new AppError("Admin only", { status: 403, code: "FORBIDDEN" })
    }

    if (parsed.data.status === conv.status) {
      res.status(204).send()
      return
    }

    await db
      .update(conversation)
      .set({ status: parsed.data.status })
      .where(eq(conversation.id, id))

    await db.insert(conversationAuditLog).values({
      id: randomUUID(),
      conversationId: id,
      action: "status_change",
      fromValue: conv.status,
      toValue: parsed.data.status,
      actorUserId: actor.userId,
    })

    await publish(channelFor.workspace(conv.workspaceId), {
      type: "conversation.updated",
      conversationId: id,
      patch: { status: parsed.data.status },
    })

    res.status(204).send()
  },
)

// ── Assign (admin) ────────────────────────────────────────────────

const assignBody = z.object({
  userId: z.string().nullable(),
})

supportRouter.post(
  "/conversations/:id/assign",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id
    if (typeof id !== "string" || !id) {
      throw new AppError("Invalid id", { status: 400, code: "VALIDATION_ERROR" })
    }
    const parsed = assignBody.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Invalid body", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }
    const actor = await resolveActor(req)
    if (!actor || actor.kind !== "user") {
      throw new AppError("Admin only", { status: 403, code: "FORBIDDEN" })
    }
    const { conv, role, workspaceRole } = await loadConversationFor(id, actor)
    if (role !== "admin" || !isAtLeastRole(workspaceRole, "admin")) {
      throw new AppError("Admin only", { status: 403, code: "FORBIDDEN" })
    }

    if (parsed.data.userId) {
      // Assignee must be a workspace member.
      const targetRole = await getMemberRole(parsed.data.userId, conv.workspaceId)
      if (!targetRole) {
        throw new AppError("Assignee is not a workspace member", {
          status: 400,
          code: "ASSIGNEE_NOT_MEMBER",
        })
      }
    }

    await db
      .update(conversation)
      .set({ assignedToUserId: parsed.data.userId })
      .where(eq(conversation.id, id))

    await db.insert(conversationAuditLog).values({
      id: randomUUID(),
      conversationId: id,
      action: "assignment_change",
      fromValue: conv.assignedToUserId,
      toValue: parsed.data.userId,
      actorUserId: actor.userId,
    })

    const assignee = parsed.data.userId
      ? await loadAssignee(parsed.data.userId)
      : null

    await publish(channelFor.workspace(conv.workspaceId), {
      type: "conversation.assigned",
      conversationId: id,
      assignedTo: assignee,
    })

    res.status(204).send()
  },
)

// ── Audit log (admin) ─────────────────────────────────────────────

supportRouter.get(
  "/conversations/:id/audit",
  requireAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id
    if (typeof id !== "string" || !id) {
      throw new AppError("Invalid id", { status: 400, code: "VALIDATION_ERROR" })
    }
    const actor = await resolveActor(req)
    if (!actor || actor.kind !== "user") {
      throw new AppError("Admin only", { status: 403, code: "FORBIDDEN" })
    }
    const { workspaceRole } = await loadConversationFor(id, actor)
    if (!workspaceRole) {
      throw new AppError("Admin only", { status: 403, code: "FORBIDDEN" })
    }
    const rows = await db
      .select({
        id: conversationAuditLog.id,
        action: conversationAuditLog.action,
        fromValue: conversationAuditLog.fromValue,
        toValue: conversationAuditLog.toValue,
        createdAt: conversationAuditLog.createdAt,
        actorId: user.id,
        actorName: user.name,
      })
      .from(conversationAuditLog)
      .leftJoin(user, eq(user.id, conversationAuditLog.actorUserId))
      .where(eq(conversationAuditLog.conversationId, id))
      .orderBy(asc(conversationAuditLog.createdAt))
    res.json({
      audit: rows.map((r) => ({
        id: r.id,
        action: r.action,
        fromValue: r.fromValue,
        toValue: r.toValue,
        createdAt: r.createdAt.toISOString(),
        actor: r.actorId ? { id: r.actorId, name: r.actorName ?? "" } : null,
      })),
    })
  },
)

// ── My conversation in this workspace (customer-side widget bootstrap) ─

supportRouter.get(
  "/me/conversation",
  requireAnyAuth,
  async (req: Request, res: Response) => {
    const slug =
      typeof req.query.workspaceSlug === "string"
        ? req.query.workspaceSlug
        : null
    if (!slug) {
      throw new AppError("workspaceSlug required", {
        status: 400,
        code: "VALIDATION_ERROR",
      })
    }
    const actor = await resolveActor(req)
    if (!actor) {
      throw new AppError("Not signed in", { status: 401, code: "UNAUTHORIZED" })
    }
    const [ws] = await db
      .select()
      .from(workspace)
      .where(eq(workspace.slug, slug))
    if (!ws) {
      throw new AppError("Workspace not found", {
        status: 404,
        code: "WORKSPACE_NOT_FOUND",
      })
    }
    if (actor.kind === "visitor" && actor.workspaceId !== ws.id) {
      throw new AppError("Visitor / workspace mismatch", {
        status: 403,
        code: "FORBIDDEN",
      })
    }

    const customerUserId = actor.kind === "user" ? actor.userId : null
    const customerVisitorId = actor.kind === "visitor" ? actor.visitorId : null
    const [conv] = await db
      .select()
      .from(conversation)
      .where(
        and(
          eq(conversation.workspaceId, ws.id),
          customerUserId
            ? eq(conversation.customerUserId, customerUserId)
            : undefined,
          customerVisitorId
            ? eq(conversation.customerVisitorId, customerVisitorId)
            : undefined,
        ),
      )
    if (!conv) {
      res.json({ conversation: null })
      return
    }
    const customer = await loadAuthorJoin(
      conv.customerUserId,
      conv.customerVisitorId,
    )
    res.json({
      conversation: serializeConversation(conv, {
        customer,
        lastMessage: null,
        assignee: null,
      }),
    })
  },
)

// ── Search (admin) ────────────────────────────────────────────────

supportRouter.get(
  "/search",
  requireAuth,
  requireWorkspaceMember(),
  async (req: Request, res: Response) => {
    const ctx = res.locals.workspaceContext!
    const q =
      typeof req.query.q === "string" ? req.query.q.trim().slice(0, 200) : ""
    if (!q) {
      res.json({ hits: [] })
      return
    }
    const tsQuery = sql`websearch_to_tsquery('simple', ${q})`
    const rows = await db
      .select({
        msg: supportMessage,
        conversationId: conversation.id,
        customerUserId: conversation.customerUserId,
        customerVisitorId: conversation.customerVisitorId,
        userId: user.id,
        userName: user.name,
        userImage: user.image,
        visitorId: visitor.id,
        visitorName: visitor.name,
        visitorAvatar: visitor.avatarUrl,
        headline: sql<string>`ts_headline('simple', ${supportMessage.body}, ${tsQuery}, 'StartSel=<b>, StopSel=</b>, MaxFragments=2, MinWords=3, MaxWords=15')`,
        rank: sql<number>`ts_rank(${sql.raw('search_vector')}, ${tsQuery})`,
      })
      .from(supportMessage)
      .innerJoin(conversation, eq(conversation.id, supportMessage.conversationId))
      .leftJoin(user, eq(user.id, supportMessage.authorUserId))
      .leftJoin(visitor, eq(visitor.id, supportMessage.authorVisitorId))
      .where(
        and(
          eq(conversation.workspaceId, ctx.workspace.id),
          sql`${sql.raw('search_vector')} @@ ${tsQuery}`,
        ),
      )
      .orderBy(desc(sql`rank`), desc(supportMessage.createdAt))
      .limit(20)

    // Resolve customer for each hit's conversation.
    const customerJoins = await Promise.all(
      rows.map((r) =>
        loadAuthorJoin(r.customerUserId, r.customerVisitorId).then((author) => ({
          conversationId: r.conversationId,
          author,
          customerUserId: r.customerUserId,
          customerVisitorId: r.customerVisitorId,
        })),
      ),
    )
    const customerByConv = new Map(
      customerJoins.map((c) => [c.conversationId, c]),
    )

    const hits = rows.map((r) => {
      const c = customerByConv.get(r.conversationId)!
      return {
        message: serializeMessage(r.msg, {
          userId: r.userId,
          userName: r.userName,
          userImage: r.userImage,
          visitorId: r.visitorId,
          visitorName: r.visitorName,
          visitorAvatar: r.visitorAvatar,
        }),
        conversation: {
          id: r.conversationId,
          customer: serializeMessageCustomer(
            c.author,
            c.customerUserId,
            c.customerVisitorId,
          ),
        },
        highlight: r.headline,
      }
    })

    res.json({ hits })
  },
)

// ── Presence (initial load) ───────────────────────────────────────

// "Is anyone from this workspace online right now?" — the widget calls
// this on mount to seed its header indicator before WebSocket presence
// events start streaming.
supportRouter.get("/presence", async (req: Request, res: Response) => {
  const slug =
    typeof req.query.workspaceSlug === "string"
      ? req.query.workspaceSlug
      : null
  if (!slug) {
    throw new AppError("workspaceSlug required", {
      status: 400,
      code: "VALIDATION_ERROR",
    })
  }
  const [ws] = await db
    .select({ id: workspace.id })
    .from(workspace)
    .where(eq(workspace.slug, slug))
  if (!ws) {
    throw new AppError("Workspace not found", {
      status: 404,
      code: "WORKSPACE_NOT_FOUND",
    })
  }
  const { isAnyoneOnline } = await import("../lib/realtime/presence.js")
  res.json({ online: isAnyoneOnline(ws.id) })
})

// ── Helpers ───────────────────────────────────────────────────────

async function loadAuthorJoin(
  userId: string | null,
  visitorId: string | null,
): Promise<AuthorJoin> {
  if (userId) {
    const [u] = await db
      .select({ id: user.id, name: user.name, image: user.image })
      .from(user)
      .where(eq(user.id, userId))
    return {
      userId: u?.id ?? null,
      userName: u?.name ?? null,
      userImage: u?.image ?? null,
      visitorId: null,
      visitorName: null,
      visitorAvatar: null,
    }
  }
  if (visitorId) {
    const [v] = await db
      .select({
        id: visitor.id,
        name: visitor.name,
        avatarUrl: visitor.avatarUrl,
      })
      .from(visitor)
      .where(eq(visitor.id, visitorId))
    return {
      userId: null,
      userName: null,
      userImage: null,
      visitorId: v?.id ?? null,
      visitorName: v?.name ?? null,
      visitorAvatar: v?.avatarUrl ?? null,
    }
  }
  return {
    userId: null,
    userName: null,
    userImage: null,
    visitorId: null,
    visitorName: null,
    visitorAvatar: null,
  }
}

async function loadAssignee(
  userId: string,
): Promise<{ id: string; name: string; image: string | null } | null> {
  const [u] = await db
    .select({ id: user.id, name: user.name, image: user.image })
    .from(user)
    .where(eq(user.id, userId))
  if (!u) return null
  return { id: u.id, name: u.name, image: u.image ?? null }
}

function serializeMessageCustomer(
  author: AuthorJoin,
  customerUserId: string | null,
  customerVisitorId: string | null,
) {
  if (customerUserId && author.userId === customerUserId) {
    return {
      id: author.userId,
      name: author.userName ?? "Unknown",
      kind: "user" as const,
      image: author.userImage ?? null,
    }
  }
  if (customerVisitorId && author.visitorId === customerVisitorId) {
    return {
      id: author.visitorId,
      name: author.visitorName ?? "Visitor",
      kind: "visitor" as const,
      image: author.visitorAvatar ?? null,
    }
  }
  return {
    id: customerUserId ?? customerVisitorId ?? "",
    name: "Deleted user",
    kind: customerUserId ? ("user" as const) : ("visitor" as const),
    image: null,
  }
}

void workspaceMember
