"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { ApiError } from "@/lib/http/api-error"
import { queryKeys } from "@/lib/query/keys"
import {
  createAdminPost,
  deletePost,
  mergePost,
  pinPost,
  updatePost,
  updatePostStatus,
} from "@/services/posts-admin"

// Standard error-message resolver — pulls the server's human message
// out of `ApiError` when present, falls back to a generic line.
function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message
  return fallback
}

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

// boardId is part of the mutation variables (not the hook arg) so the
// same hook handles fixed-board callers (admin "New post" dialog,
// per-board public submit) and the "pick a board" path used by the
// all-feedback view.
export function useCreatePostMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: {
      boardId: string
      title: string
      description: string
    }) =>
      createAdminPost(vars.boardId, {
        title: vars.title,
        description: vars.description,
      }),
    onSuccess: (_data, vars) => {
      // Invalidate every paginated variant of this board's feed (sort
      // + search axes) by matching on the prefix.
      qc.invalidateQueries({ queryKey: ["boards", vars.boardId, "posts"] })
      // Plus any all-feedback caches that aggregate this workspace —
      // the broader prefix catches them.
      qc.invalidateQueries({ queryKey: ["boards", "all-feedback"] })
      qc.invalidateQueries({
        queryKey: ["boards", "by-slug"],
      })
      invalidatePostSurfaces(qc)
      toast.success("Post submitted")
    },
    onError: (err) => {
      toast.error(describeError(err, "Couldn't submit the post"))
    },
  })
}

export function useUpdatePostMutation(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { title?: string; description?: string }) =>
      updatePost(postId, body),
    onSuccess: () => {
      invalidatePostSurfaces(qc, postId)
      toast.success("Post updated")
    },
    onError: (err) => {
      toast.error(describeError(err, "Couldn't update the post"))
    },
  })
}

export function useDeletePostMutation(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      invalidatePostSurfaces(qc, postId)
      toast.success("Post deleted")
    },
    onError: (err) => {
      toast.error(describeError(err, "Couldn't delete the post"))
    },
  })
}

export function usePinPostMutation(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pinned: boolean) => pinPost(postId, { pinned }),
    onSuccess: (_data, pinned) => {
      invalidatePostSurfaces(qc, postId)
      toast.success(pinned ? "Post pinned" : "Post unpinned")
    },
    onError: (err) => {
      toast.error(describeError(err, "Couldn't update pin state"))
    },
  })
}

export function useUpdatePostStatusMutation(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: string) => updatePostStatus(postId, { status }),
    onSuccess: (_data, status) => {
      invalidatePostSurfaces(qc, postId)
      toast.success(`Status updated to ${status.replace(/-/g, " ")}`)
    },
    onError: (err) => {
      toast.error(describeError(err, "Couldn't update status"))
    },
  })
}

export function useMergePostMutation(postId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (targetPostId: string) => mergePost(postId, { targetPostId }),
    onSuccess: () => {
      invalidatePostSurfaces(qc, postId)
      toast.success("Post merged")
    },
    onError: (err) => {
      toast.error(describeError(err, "Couldn't merge the post"))
    },
  })
}
