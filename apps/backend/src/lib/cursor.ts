// Cursor-based pagination helpers shared by every list endpoint.
//
// We use opaque base64url-encoded JSON for cursors instead of exposing
// raw column values. Two reasons: (1) lets us version the format if we
// ever change sort keys without breaking existing clients, (2) avoids
// users hand-crafting cursors and probing the dataset.
//
// Cursors encode the *last item seen* on the previous page. The next
// page is "everything strictly after this point in the sort order".
// We always include `id` as a deterministic tiebreaker so a page is
// reproducible even when two rows share the same sort value.

export type PostsCursorNewest = {
  k: "newest"
  /** ISO date — `created_at` of the last item on the previous page. */
  ca: string
  /** Post id — tiebreaker for rows with identical createdAt. */
  id: string
}

export type PostsCursorVotes = {
  k: "votes"
  /** Vote count of the last item. */
  vc: number
  ca: string
  id: string
}

export type PostsCursor = PostsCursorNewest | PostsCursorVotes

export type CommentsCursor = {
  k: "comments"
  /** ISO date — comments sort ascending (chronological). */
  ca: string
  id: string
}

export type ChangelogCursor = {
  k: "changelog"
  /** ISO date — `published_at` (or `created_at` for admin) of last entry. */
  pa: string
  id: string
}

export type SupportConversationsCursor = {
  k: "support-convs"
  /** ISO date — `last_message_at` of the last conversation on the page. */
  lm: string
  id: string
}

export type SupportMessagesCursor = {
  k: "support-msgs"
  /** ISO date — `created_at` of the OLDEST message on the page (we
   *  paginate older-than-cursor on scroll-up). */
  ca: string
  id: string
}

export type AnyCursor =
  | PostsCursor
  | CommentsCursor
  | ChangelogCursor
  | SupportConversationsCursor
  | SupportMessagesCursor

export function encodeCursor(cursor: AnyCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf-8").toString("base64url")
}

/** Returns null if the cursor is missing, malformed, or fails the type
 *  guard. Callers treat null as "first page". */
export function decodeCursor<T extends AnyCursor>(
  raw: string | undefined | null,
  guard: (c: AnyCursor) => c is T
): T | null {
  if (!raw) return null
  try {
    const json = Buffer.from(raw, "base64url").toString("utf-8")
    const obj = JSON.parse(json) as AnyCursor
    return guard(obj) ? obj : null
  } catch {
    return null
  }
}

export const isPostsCursor = (c: AnyCursor): c is PostsCursor =>
  c.k === "newest" || c.k === "votes"
export const isCommentsCursor = (c: AnyCursor): c is CommentsCursor =>
  c.k === "comments"
export const isChangelogCursor = (c: AnyCursor): c is ChangelogCursor =>
  c.k === "changelog"
export const isSupportConversationsCursor = (
  c: AnyCursor,
): c is SupportConversationsCursor => c.k === "support-convs"
export const isSupportMessagesCursor = (
  c: AnyCursor,
): c is SupportMessagesCursor => c.k === "support-msgs"

/** Standard page sizes — exported so frontend types/SSR can mirror. */
export const PAGE_SIZE = {
  posts: 10,
  comments: 10,
  changelog: 10,
  supportConversations: 20,
  supportMessages: 20,
} as const

/** Parses sort param from query string, defaults to "newest". */
export function parseSort(raw: unknown): "newest" | "votes" {
  return raw === "votes" ? "votes" : "newest"
}

/** Trims + caps search input. Empty string treated as "no search". */
export function parseSearch(raw: unknown): string {
  if (typeof raw !== "string") return ""
  return raw.trim().slice(0, 200)
}
