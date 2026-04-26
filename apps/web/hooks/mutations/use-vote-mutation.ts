"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { PostRow } from "@/components/boards/types"
import { ApiError } from "@/lib/http/api-error"
import type { PostsPage } from "@/services/boards"
import { toggleVote, type VoteResult } from "@/services/votes"

type InfinitePostsCache = {
  pages: PostsPage<PostRow>[]
  pageParams: unknown[]
}

function isInfinitePostsCache(value: unknown): value is InfinitePostsCache {
  if (!value || typeof value !== "object") return false
  const v = value as { pages?: unknown }
  return Array.isArray(v.pages)
}

// Vote toggle. The public board feed and the all-feedback feed both
// live in cursor-paginated `useInfiniteQuery` caches, so we walk every
// `["boards", ...]` cache, locate the post in any page, and patch its
// vote count / hasVoted in place. Saves an invalidation round-trip and
// keeps the UI snappy.
export function useVoteMutation(args: { postId: string }) {
  const qc = useQueryClient()

  // Build a snapshot patcher applied to every matching cache entry. The
  // boards prefix matches both `bySlugPosts` and `allFeedbackPosts`
  // entries — also matches `bySlug` metadata + `allFeedback` metadata
  // but those don't have `pages`, so the early-return skips them.
  function patchPost(updater: (p: PostRow) => PostRow) {
    qc.setQueriesData(
      { queryKey: ["boards"] },
      (cur: unknown) => {
        if (!isInfinitePostsCache(cur)) return cur
        return {
          ...cur,
          pages: cur.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) =>
              p.id === args.postId ? updater(p) : p,
            ),
          })),
        }
      },
    )
  }

  return useMutation({
    mutationFn: () => toggleVote(args.postId),

    onMutate: async () => {
      // Optimistic flip — keeps the vote button feeling instant.
      patchPost((p) => ({
        ...p,
        hasVoted: !p.hasVoted,
        voteCount: p.hasVoted ? p.voteCount - 1 : p.voteCount + 1,
      }))
    },

    onError: (err) => {
      // Server rejected — re-fetch to pull the authoritative state.
      // Cheaper to invalidate than to track the pre-mutation snapshot
      // across N pages.
      void qc.invalidateQueries({ queryKey: ["boards"] })
      // No success toast for votes (too frequent / silent UX), but
      // surface any server error so the user knows their optimistic
      // flip reverted and why.
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't update your vote",
      )
    },

    onSuccess: (result: VoteResult) => {
      patchPost((p) => ({
        ...p,
        hasVoted: result.hasVoted,
        voteCount: result.voteCount,
      }))
    },
  })
}
