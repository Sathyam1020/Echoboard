"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { CommentRow, CommentsPage } from "@/components/boards/types"
import { queryKeys } from "@/lib/query/keys"
import {
  createComment,
  deleteComment,
  updateComment,
} from "@/services/comments"

// Comments live in a `useInfiniteQuery` cache: `{ pages: [{ comments,
// nextCursor }, ...] }`. New comments append to the last page; updates
// and deletes patch in place across all pages.

type InfiniteCommentsCache = {
  pages: CommentsPage[]
  pageParams: unknown[]
}

function isInfiniteCommentsCache(value: unknown): value is InfiniteCommentsCache {
  if (!value || typeof value !== "object") return false
  const v = value as { pages?: unknown }
  return Array.isArray(v.pages)
}

function mapComments(
  cache: InfiniteCommentsCache,
  fn: (c: CommentRow) => CommentRow,
): InfiniteCommentsCache {
  return {
    ...cache,
    pages: cache.pages.map((p) => ({
      ...p,
      comments: p.comments.map(fn),
    })),
  }
}

export function useCreateCommentMutation(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { body: string; parentId?: string | null }) =>
      createComment(postId, body),
    onSuccess: (res) => {
      // Append to the last loaded page so the new comment appears at
      // the bottom of the chronological list. If no pages have loaded
      // yet, we just stash a single page — `useInfiniteQuery` will
      // pick it up on next refetch with a proper cursor.
      qc.setQueryData<InfiniteCommentsCache>(
        queryKeys.comments.byPost(postId),
        (cur) => {
          if (!cur || !isInfiniteCommentsCache(cur)) {
            return {
              pages: [{ comments: [res.comment], nextCursor: null }],
              pageParams: [null],
            }
          }
          const last = cur.pages[cur.pages.length - 1]
          if (!last) {
            return {
              ...cur,
              pages: [{ comments: [res.comment], nextCursor: null }],
            }
          }
          const updatedLast: CommentsPage = {
            ...last,
            comments: [...last.comments, res.comment],
          }
          return {
            ...cur,
            pages: [...cur.pages.slice(0, -1), updatedLast],
          }
        },
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
      qc.setQueryData<InfiniteCommentsCache>(
        queryKeys.comments.byPost(postId),
        (cur) => {
          if (!cur || !isInfiniteCommentsCache(cur)) return cur
          return mapComments(cur, (c) =>
            c.id === res.comment.id ? res.comment : c,
          )
        },
      )
    },
  })
}

export function useDeleteCommentMutation(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: (res) => {
      // Delete returns a soft-deleted shape (deletedAt set). Replace
      // inline so the row collapses to "deleted" rather than
      // disappearing — matches the existing UX of CommentList.
      qc.setQueryData<InfiniteCommentsCache>(
        queryKeys.comments.byPost(postId),
        (cur) => {
          if (!cur || !isInfiniteCommentsCache(cur)) return cur
          return mapComments(cur, (c) =>
            c.id === res.comment.id ? res.comment : c,
          )
        },
      )
    },
  })
}
