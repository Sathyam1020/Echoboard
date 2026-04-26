// Central query key registry. Every useQuery / useMutation / cache
// invalidation references one of these. Keeps cache lookups consistent
// across server prefetch and client consumption — a typo in a key is the
// quickest way to silently break SSR hydration.
//
// Convention: read-keys are functions returning tuples; mutations don't
// have keys, they use these to invalidate / setQueryData.

export const queryKeys = {
  boards: {
    all: () => ["boards"] as const,
    bySlug: (workspaceSlug: string, boardSlug: string) =>
      ["boards", "by-slug", workspaceSlug, boardSlug] as const,
    /** Paginated per-board public feed. Sort + search included so the
     *  cache key changes when the user toggles them. */
    bySlugPosts: (
      workspaceSlug: string,
      boardSlug: string,
      sort: "newest" | "votes",
      search: string,
    ) =>
      ["boards", "by-slug", workspaceSlug, boardSlug, "posts", sort, search] as const,
    /** Admin per-boardId paginated feed. */
    posts: (boardId: string, sort: "newest" | "votes", search: string) =>
      ["boards", boardId, "posts", sort, search] as const,
    /** All-feedback workspace-root metadata. */
    allFeedback: (workspaceSlug: string) =>
      ["boards", "all-feedback", workspaceSlug] as const,
    /** Paginated all-feedback posts. */
    allFeedbackPosts: (
      workspaceSlug: string,
      sort: "newest" | "votes",
      search: string,
    ) =>
      ["boards", "all-feedback", workspaceSlug, "posts", sort, search] as const,
    /** Public roadmap — non-paginated, status-bounded. */
    roadmap: (workspaceSlug: string, boardSlug: string) =>
      ["boards", "roadmap", workspaceSlug, boardSlug] as const,
  },

  posts: {
    detail: (postId: string) => ["posts", "detail", postId] as const,
  },

  comments: {
    byPost: (postId: string) => ["comments", "by-post", postId] as const,
  },

  visitors: {
    me: () => ["visitors", "me"] as const,
  },

  workspaces: {
    me: () => ["workspaces", "me"] as const,
    settings: () => ["workspaces", "me", "settings"] as const,
  },

  dashboard: {
    boards: () => ["dashboard", "boards"] as const,
    recentPosts: () => ["dashboard", "recent-posts"] as const,
    feedback: (boardId: string) => ["dashboard", "feedback", boardId] as const,
    roadmap: (boardId: string) => ["dashboard", "roadmap", boardId] as const,
  },

  profile: {
    detail: (workspaceSlug: string, actorId: string) =>
      ["profile", workspaceSlug, actorId] as const,
    feedback: (workspaceSlug: string, actorId: string) =>
      ["profile", workspaceSlug, actorId, "feedback"] as const,
    comments: (workspaceSlug: string, actorId: string) =>
      ["profile", workspaceSlug, actorId, "comments"] as const,
  },

  changelog: {
    list: () => ["changelog", "list"] as const,
    detail: (entryId: string) => ["changelog", "detail", entryId] as const,
    /** Public changelog metadata (workspace + firstBoard). */
    publicByWorkspace: (workspaceSlug: string) =>
      ["changelog", "public", workspaceSlug] as const,
    /** Paginated public changelog entries. */
    publicEntries: (workspaceSlug: string) =>
      ["changelog", "public", workspaceSlug, "entries"] as const,
  },

  widget: {
    config: (boardId: string) => ["widget", "config", boardId] as const,
  },
}
