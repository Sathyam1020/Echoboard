"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import {
  createComment,
  deleteComment,
  updateComment,
} from "@/services/comments"
import type { PostDetailResponse } from "@/services/posts"

// Comments live inside the post detail response (not a separate query). On
// any comment mutation we invalidate the post detail so the list rerenders
// from server truth — simpler than splicing into the cached array, and the
// post detail query refetch is cheap.
export function useCreateCommentMutation(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { body: string; parentId?: string | null }) =>
      createComment(postId, body),
    onSuccess: (res) => {
      qc.setQueryData<PostDetailResponse>(
        queryKeys.posts.detail(postId),
        (cur) => (cur ? { ...cur, comments: [...cur.comments, res.comment] } : cur),
      )
    },
  })
}

export function useUpdateCommentMutation(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { commentId: string; body: string }) =>
      updateComment(args.commentId, { body: args.body }),
    onSuccess: (res) => {
      qc.setQueryData<PostDetailResponse>(
        queryKeys.posts.detail(postId),
        (cur) =>
          cur
            ? {
                ...cur,
                comments: cur.comments.map((c) =>
                  c.id === res.comment.id ? res.comment : c,
                ),
              }
            : cur,
      )
    },
  })
}

export function useDeleteCommentMutation(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: (res) => {
      // Delete returns a soft-deleted shape (deletedAt set). Replace inline so
      // the row collapses to "deleted" rather than disappearing — matches the
      // existing UX of CommentList.
      qc.setQueryData<PostDetailResponse>(
        queryKeys.posts.detail(postId),
        (cur) =>
          cur
            ? {
                ...cur,
                comments: cur.comments.map((c) =>
                  c.id === res.comment.id ? res.comment : c,
                ),
              }
            : cur,
      )
    },
  })
}
