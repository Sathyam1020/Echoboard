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
    posts: (boardId: string) => ["boards", boardId, "posts"] as const,
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

  changelog: {
    list: () => ["changelog", "list"] as const,
    detail: (entryId: string) => ["changelog", "detail", entryId] as const,
    publicByWorkspace: (workspaceSlug: string) =>
      ["changelog", "public", workspaceSlug] as const,
  },

  widget: {
    config: (boardId: string) => ["widget", "config", boardId] as const,
  },
}
