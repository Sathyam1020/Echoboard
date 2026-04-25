"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import {
  createAdminPost,
  deletePost,
  mergePost,
  pinPost,
  updatePost,
  updatePostStatus,
} from "@/services/posts-admin"

// Catch-all invalidation: a post mutation can affect the dashboard boards
// (post counts), the per-board feedback list, the public board cache,
// and the post detail cache. Invalidate broadly — react-query dedupes
// the resulting refetches.
function invalidatePostSurfaces(qc: ReturnType<typeof useQueryClient>, postId?: string) {
  qc.invalidateQueries({ queryKey: queryKeys.boards.all() })
  qc.invalidateQueries({ queryKey: queryKeys.dashboard.boards() })
  qc.invalidateQueries({ queryKey: queryKeys.dashboard.recentPosts() })
  if (postId) qc.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) })
}

export function useCreatePostMutation(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { title: string; description: string }) =>
      createAdminPost(boardId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.boards.posts(boardId) })
      invalidatePostSurfaces(qc)
    },
  })
}

export function useUpdatePostMutation(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { title?: string; description?: string }) =>
      updatePost(postId, body),
    onSuccess: () => invalidatePostSurfaces(qc, postId),
  })
}

export function useDeletePostMutation(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => invalidatePostSurfaces(qc, postId),
  })
}

export function usePinPostMutation(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pinned: boolean) => pinPost(postId, { pinned }),
    onSuccess: () => invalidatePostSurfaces(qc, postId),
  })
}

export function useUpdatePostStatusMutation(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: string) => updatePostStatus(postId, { status }),
    onSuccess: () => invalidatePostSurfaces(qc, postId),
  })
}

export function useMergePostMutation(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (targetPostId: string) => mergePost(postId, { targetPostId }),
    onSuccess: () => invalidatePostSurfaces(qc, postId),
  })
}
