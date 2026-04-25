"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import type { BoardBySlugResponse } from "@/services/boards"
import { toggleVote, type VoteResult } from "@/services/votes"

// Vote toggle. When `workspaceSlug` + `boardSlug` are provided, the
// public-board cache is updated optimistically so list re-renders feel
// instant. Without them (admin pages, post detail without the board cache)
// the mutation just makes the network call — caller manages local state.
export function useVoteMutation(args: {
  workspaceSlug?: string
  boardSlug?: string
  postId: string
}) {
  const qc = useQueryClient()
  const cacheKey =
    args.workspaceSlug && args.boardSlug
      ? queryKeys.boards.bySlug(args.workspaceSlug, args.boardSlug)
      : null

  return useMutation({
    mutationFn: () => toggleVote(args.postId),

    onMutate: async (): Promise<{ previous: BoardBySlugResponse | undefined }> => {
      if (!cacheKey) return { previous: undefined }
      await qc.cancelQueries({ queryKey: cacheKey })
      const previous = qc.getQueryData<BoardBySlugResponse>(cacheKey)
      if (!previous) return { previous: undefined }

      qc.setQueryData<BoardBySlugResponse>(cacheKey, (cur) => {
        if (!cur) return cur
        return {
          ...cur,
          posts: cur.posts.map((p) =>
            p.id !== args.postId
              ? p
              : {
                  ...p,
                  hasVoted: !p.hasVoted,
                  voteCount: p.hasVoted ? p.voteCount - 1 : p.voteCount + 1,
                },
          ),
        }
      })

      return { previous }
    },

    onError: (_err, _vars, ctx) => {
      if (!cacheKey || !ctx?.previous) return
      qc.setQueryData(cacheKey, ctx.previous)
    },

    onSuccess: (result: VoteResult) => {
      if (!cacheKey) return
      qc.setQueryData<BoardBySlugResponse>(cacheKey, (cur) => {
        if (!cur) return cur
        return {
          ...cur,
          posts: cur.posts.map((p) =>
            p.id !== args.postId
              ? p
              : { ...p, hasVoted: result.hasVoted, voteCount: result.voteCount },
          ),
        }
      })
    },
  })
}
