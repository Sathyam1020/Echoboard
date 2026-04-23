import { relations } from "drizzle-orm"
import { pgTable, primaryKey, text, timestamp, index, uniqueIndex, type AnyPgColumn } from "drizzle-orm/pg-core"

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

export const post = pgTable(
  "post",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id")
      .notNull()
      .references(() => board.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: text("status").default("review").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("post_boardId_idx").on(table.boardId),
    index("post_boardId_createdAt_idx").on(table.boardId, table.createdAt),
  ],
)

export const workspaceRelations = relations(workspace, ({ one, many }) => ({
  owner: one(user, {
    fields: [workspace.ownerId],
    references: [user.id],
  }),
  boards: many(board),
}))

export const boardRelations = relations(board, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [board.workspaceId],
    references: [workspace.id],
  }),
  posts: many(post),
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
  votes: many(postVote),
  comments: many(comment),
}))

export const postVote = pgTable(
  "post_vote",
  {
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.userId] }),
    index("post_vote_user_id_idx").on(table.userId),
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
}))

export const comment = pgTable(
  "comment",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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
  parent: one(comment, {
    fields: [comment.parentId],
    references: [comment.id],
    relationName: "commentChildren",
  }),
  children: many(comment, {
    relationName: "commentChildren",
  }),
}))
