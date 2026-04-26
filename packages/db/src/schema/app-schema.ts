import { relations, sql } from "drizzle-orm"
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core"

import { user } from "./auth-schema.js"

export const workspace = pgTable(
  "workspace",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    logoUrl: text("logo_url"),
    // Public-board auth mode: how visitors authenticate. Default 'guest' so
    // existing workspaces keep working unchanged.
    publicBoardAuth: text("public_board_auth").default("guest").notNull(),
    // HMAC secret for the Secure Identify flow. Auto-generated for new
    // workspaces in app code; existing rows backfilled in the migration.
    identifySecretKey: text("identify_secret_key"),
    // When true, /api/visitors/identify rejects unsigned identity payloads —
    // host SaaS must mint a signed token via their backend. Default false so
    // existing workspaces keep working.
    requireSignedIdentify: boolean("require_signed_identify")
      .default(false)
      .notNull(),
    ssoRedirectUrl: text("sso_redirect_url"),
    ssoSharedSecret: text("sso_shared_secret"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("workspace_ownerId_idx").on(table.ownerId)],
)

export const board = pgTable(
  "board",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    visibility: text("visibility").default("public").notNull(),
    // Widget visual config — applied by the widget loader script + iframe UI.
    widgetColor: text("widget_color"),
    widgetPosition: text("widget_position")
      .default("bottom-right")
      .notNull(),
    widgetButtonText: text("widget_button_text")
      .default("Feedback")
      .notNull(),
    widgetShowBranding: boolean("widget_show_branding")
      .default(true)
      .notNull(),
    // When true, the embedded widget on this board exposes the Support
    // tab. Defaults off so existing boards keep their current widget UX.
    supportEnabled: boolean("support_enabled").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("board_workspaceId_slug_unique").on(
      table.workspaceId,
      table.slug,
    ),
    index("board_workspaceId_idx").on(table.workspaceId),
  ],
)

// End-user identity. Lives per workspace. Email and externalId are both
// nullable but at least one must be set for the row to be useful.
export const visitor = pgTable(
  "visitor",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    externalId: text("external_id"),
    email: text("email"),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
    // 'guest' | 'identify' | 'secure_identify' | 'oauth_google' | 'sso' | 'echoboard_user'
    authMethod: text("auth_method").notNull(),
    hmacVerified: boolean("hmac_verified").default(false).notNull(),
    firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("visitor_workspaceId_idx").on(table.workspaceId),
    index("visitor_email_idx").on(table.email),
    // Partial uniques: dedupe per workspace by email and by externalId,
    // but only when those fields are present.
    uniqueIndex("visitor_workspaceId_email_uq")
      .on(table.workspaceId, table.email)
      .where(sql`${table.email} is not null`),
    uniqueIndex("visitor_workspaceId_externalId_uq")
      .on(table.workspaceId, table.externalId)
      .where(sql`${table.externalId} is not null`),
  ],
)

export const visitorSession = pgTable(
  "visitor_session",
  {
    id: text("id").primaryKey(),
    visitorId: text("visitor_id")
      .notNull()
      .references(() => visitor.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("visitor_session_token_idx").on(table.token),
    index("visitor_session_visitorId_idx").on(table.visitorId),
  ],
)

export const post = pgTable(
  "post",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id")
      .notNull()
      .references(() => board.id, { onDelete: "cascade" }),
    // XOR with visitorId — exactly one is set per row (enforced by CHECK).
    authorId: text("author_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    visitorId: text("visitor_id").references((): AnyPgColumn => visitor.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: text("status").default("review").notNull(),
    pinnedAt: timestamp("pinned_at"),
    mergedIntoPostId: text("merged_into_post_id").references(
      (): AnyPgColumn => post.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("post_boardId_idx").on(table.boardId),
    index("post_boardId_createdAt_idx").on(table.boardId, table.createdAt),
    index("post_mergedIntoPostId_idx").on(table.mergedIntoPostId),
    index("post_visitorId_idx").on(table.visitorId),
    check(
      "post_author_xor",
      sql`(${table.authorId} is not null and ${table.visitorId} is null) or (${table.authorId} is null and ${table.visitorId} is not null)`,
    ),
  ],
)

export const workspaceRelations = relations(workspace, ({ one, many }) => ({
  owner: one(user, {
    fields: [workspace.ownerId],
    references: [user.id],
  }),
  boards: many(board),
  visitors: many(visitor),
}))

export const boardRelations = relations(board, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [board.workspaceId],
    references: [workspace.id],
  }),
  posts: many(post),
}))

export const visitorRelations = relations(visitor, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [visitor.workspaceId],
    references: [workspace.id],
  }),
  sessions: many(visitorSession),
  posts: many(post),
  votes: many(postVote),
  comments: many(comment),
}))

export const visitorSessionRelations = relations(visitorSession, ({ one }) => ({
  visitor: one(visitor, {
    fields: [visitorSession.visitorId],
    references: [visitor.id],
  }),
}))

export const postRelations = relations(post, ({ one, many }) => ({
  board: one(board, {
    fields: [post.boardId],
    references: [board.id],
  }),
  author: one(user, {
    fields: [post.authorId],
    references: [user.id],
  }),
  visitor: one(visitor, {
    fields: [post.visitorId],
    references: [visitor.id],
  }),
  votes: many(postVote),
  comments: many(comment),
}))

export const postVote = pgTable(
  "post_vote",
  {
    // Synthetic PK — the old composite (postId, userId) PK is gone because
    // we now allow visitor-attributed votes too. Uniqueness is preserved via
    // partial unique indexes below.
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").references((): AnyPgColumn => visitor.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("post_vote_user_id_idx").on(table.userId),
    index("post_vote_visitor_id_idx").on(table.visitorId),
    uniqueIndex("post_vote_post_user_uq")
      .on(table.postId, table.userId)
      .where(sql`${table.userId} is not null`),
    uniqueIndex("post_vote_post_visitor_uq")
      .on(table.postId, table.visitorId)
      .where(sql`${table.visitorId} is not null`),
    check(
      "post_vote_voter_xor",
      sql`(${table.userId} is not null and ${table.visitorId} is null) or (${table.userId} is null and ${table.visitorId} is not null)`,
    ),
  ],
)

export const postVoteRelations = relations(postVote, ({ one }) => ({
  post: one(post, {
    fields: [postVote.postId],
    references: [post.id],
  }),
  user: one(user, {
    fields: [postVote.userId],
    references: [user.id],
  }),
  visitor: one(visitor, {
    fields: [postVote.visitorId],
    references: [visitor.id],
  }),
}))

export const comment = pgTable(
  "comment",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    authorId: text("author_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    visitorId: text("visitor_id").references((): AnyPgColumn => visitor.id, {
      onDelete: "set null",
    }),
    parentId: text("parent_id").references(
      (): AnyPgColumn => comment.id,
      { onDelete: "cascade" },
    ),
    body: text("body").notNull(),
    editedAt: timestamp("edited_at"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("comment_postId_createdAt_idx").on(table.postId, table.createdAt),
    index("comment_parentId_idx").on(table.parentId),
    index("comment_authorId_idx").on(table.authorId),
    index("comment_visitorId_idx").on(table.visitorId),
    check(
      "comment_author_xor",
      sql`(${table.authorId} is not null and ${table.visitorId} is null) or (${table.authorId} is null and ${table.visitorId} is not null)`,
    ),
  ],
)

export const commentRelations = relations(comment, ({ one, many }) => ({
  post: one(post, {
    fields: [comment.postId],
    references: [post.id],
  }),
  author: one(user, {
    fields: [comment.authorId],
    references: [user.id],
  }),
  visitor: one(visitor, {
    fields: [comment.visitorId],
    references: [visitor.id],
  }),
  parent: one(comment, {
    fields: [comment.parentId],
    references: [comment.id],
    relationName: "commentChildren",
  }),
  children: many(comment, {
    relationName: "commentChildren",
  }),
}))

export const changelogEntry = pgTable(
  "changelog_entry",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("changelog_entry_workspaceId_idx").on(table.workspaceId),
    index("changelog_entry_workspaceId_publishedAt_idx").on(
      table.workspaceId,
      table.publishedAt,
    ),
  ],
)

export const changelogPost = pgTable(
  "changelog_post",
  {
    changelogEntryId: text("changelog_entry_id")
      .notNull()
      .references(() => changelogEntry.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.changelogEntryId, table.postId] }),
    index("changelog_post_postId_idx").on(table.postId),
  ],
)

export const changelogEntryRelations = relations(
  changelogEntry,
  ({ one, many }) => ({
    workspace: one(workspace, {
      fields: [changelogEntry.workspaceId],
      references: [workspace.id],
    }),
    author: one(user, {
      fields: [changelogEntry.authorId],
      references: [user.id],
    }),
    posts: many(changelogPost),
  }),
)

export const changelogPostRelations = relations(changelogPost, ({ one }) => ({
  entry: one(changelogEntry, {
    fields: [changelogPost.changelogEntryId],
    references: [changelogEntry.id],
  }),
  post: one(post, {
    fields: [changelogPost.postId],
    references: [post.id],
  }),
}))

// ── Team membership ────────────────────────────────────────────
// Many-to-many between user and workspace. Replaces the single-owner
// `workspace.ownerId` model. We keep `workspace.ownerId` for the
// migration backfill; new code reads roles from `workspaceMember`.

export const workspaceRole = pgEnum("workspace_role", [
  "owner",
  "admin",
  "member",
])

export const workspaceMember = pgTable(
  "workspace_member",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: workspaceRole("role").default("member").notNull(),
    addedByUserId: text("added_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("workspace_member_workspaceId_userId_uq").on(
      table.workspaceId,
      table.userId,
    ),
    index("workspace_member_userId_idx").on(table.userId),
  ],
)

export const workspaceInvite = pgTable(
  "workspace_invite",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: workspaceRole("role").default("member").notNull(),
    invitedByUserId: text("invited_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // HMAC of (id, workspaceId, email) — verified at accept time.
    tokenHash: text("token_hash").notNull(),
    acceptedAt: timestamp("accepted_at"),
    revokedAt: timestamp("revoked_at"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // Only one *open* invite per (workspace, email) at a time.
    uniqueIndex("workspace_invite_open_uq")
      .on(table.workspaceId, table.email)
      .where(sql`${table.acceptedAt} is null and ${table.revokedAt} is null`),
    index("workspace_invite_email_idx").on(table.email),
  ],
)

export const workspaceMemberRelations = relations(
  workspaceMember,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [workspaceMember.workspaceId],
      references: [workspace.id],
    }),
    user: one(user, {
      fields: [workspaceMember.userId],
      references: [user.id],
    }),
    addedBy: one(user, {
      fields: [workspaceMember.addedByUserId],
      references: [user.id],
      relationName: "workspaceMemberAddedBy",
    }),
  }),
)

export const workspaceInviteRelations = relations(
  workspaceInvite,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [workspaceInvite.workspaceId],
      references: [workspace.id],
    }),
    invitedBy: one(user, {
      fields: [workspaceInvite.invitedByUserId],
      references: [user.id],
    }),
  }),
)

// ── Support chat ───────────────────────────────────────────────
// `conversation` = one customer ↔ workspace thread (lifelong, status-tracked).
// `supportMessage` = individual messages, each authored by a user XOR a visitor.
// `conversationAuditLog` = status / assignment audit trail.

export const conversationStatus = pgEnum("conversation_status", [
  "open",
  "pending",
  "resolved",
])

export const conversation = pgTable(
  "conversation",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    // Customer XOR — exactly one of customerUserId / customerVisitorId is set.
    customerUserId: text("customer_user_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    customerVisitorId: text("customer_visitor_id").references(
      (): AnyPgColumn => visitor.id,
      { onDelete: "cascade" },
    ),
    status: conversationStatus("status").default("open").notNull(),
    assignedToUserId: text("assigned_to_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    unreadAdmin: integer("unread_admin").default(0).notNull(),
    unreadCustomer: integer("unread_customer").default(0).notNull(),
    lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check(
      "conversation_customer_xor",
      sql`(${table.customerUserId} is not null and ${table.customerVisitorId} is null) or (${table.customerUserId} is null and ${table.customerVisitorId} is not null)`,
    ),
    // One open conversation per (workspace, customer) — partial unique
    // for whichever side of the XOR is set.
    uniqueIndex("conversation_workspaceId_customerUserId_uq")
      .on(table.workspaceId, table.customerUserId)
      .where(sql`${table.customerUserId} is not null`),
    uniqueIndex("conversation_workspaceId_customerVisitorId_uq")
      .on(table.workspaceId, table.customerVisitorId)
      .where(sql`${table.customerVisitorId} is not null`),
    index("conversation_workspaceId_status_lastMessageAt_idx").on(
      table.workspaceId,
      table.status,
      table.lastMessageAt,
    ),
    index("conversation_assignedToUserId_idx").on(table.assignedToUserId),
  ],
)

export const supportMessage = pgTable(
  "support_message",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    // Author XOR — exactly one is set.
    authorUserId: text("author_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    authorVisitorId: text("author_visitor_id").references(
      (): AnyPgColumn => visitor.id,
      { onDelete: "set null" },
    ),
    body: text("body").notNull(),
    // Stamped when the recipient's mark-as-read endpoint passes this message id.
    readAt: timestamp("read_at"),
    deliveredAt: timestamp("delivered_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    // search_vector is a GENERATED tsvector column managed via raw SQL in the
    // migration — drizzle-kit doesn't model GENERATED columns natively, so we
    // intentionally omit it from the typed schema.
  },
  (table) => [
    check(
      "support_message_author_xor",
      sql`(${table.authorUserId} is not null and ${table.authorVisitorId} is null) or (${table.authorUserId} is null and ${table.authorVisitorId} is not null)`,
    ),
    index("support_message_conversationId_createdAt_idx").on(
      table.conversationId,
      table.createdAt,
    ),
  ],
)

export const conversationAuditAction = pgEnum("conversation_audit_action", [
  "status_change",
  "assignment_change",
])

export const conversationAuditLog = pgTable(
  "conversation_audit_log",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    action: conversationAuditAction("action").notNull(),
    fromValue: text("from_value"),
    toValue: text("to_value"),
    actorUserId: text("actor_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("conversation_audit_log_conversationId_createdAt_idx").on(
      table.conversationId,
      table.createdAt,
    ),
  ],
)

export const conversationRelations = relations(
  conversation,
  ({ one, many }) => ({
    workspace: one(workspace, {
      fields: [conversation.workspaceId],
      references: [workspace.id],
    }),
    customerUser: one(user, {
      fields: [conversation.customerUserId],
      references: [user.id],
      relationName: "conversationCustomerUser",
    }),
    customerVisitor: one(visitor, {
      fields: [conversation.customerVisitorId],
      references: [visitor.id],
    }),
    assignedTo: one(user, {
      fields: [conversation.assignedToUserId],
      references: [user.id],
      relationName: "conversationAssignedTo",
    }),
    messages: many(supportMessage),
    auditLog: many(conversationAuditLog),
  }),
)

export const supportMessageRelations = relations(supportMessage, ({ one }) => ({
  conversation: one(conversation, {
    fields: [supportMessage.conversationId],
    references: [conversation.id],
  }),
  authorUser: one(user, {
    fields: [supportMessage.authorUserId],
    references: [user.id],
  }),
  authorVisitor: one(visitor, {
    fields: [supportMessage.authorVisitorId],
    references: [visitor.id],
  }),
}))

export const conversationAuditLogRelations = relations(
  conversationAuditLog,
  ({ one }) => ({
    conversation: one(conversation, {
      fields: [conversationAuditLog.conversationId],
      references: [conversation.id],
    }),
    actor: one(user, {
      fields: [conversationAuditLog.actorUserId],
      references: [user.id],
    }),
  }),
)
