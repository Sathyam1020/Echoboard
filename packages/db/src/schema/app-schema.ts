import { relations, sql } from "drizzle-orm"
import {
  boolean,
  check,
  index,
  jsonb,
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
