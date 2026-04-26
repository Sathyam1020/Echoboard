"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { ApiError } from "@/lib/http/api-error"
import { queryKeys } from "@/lib/query/keys"

function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message
  return fallback
}
import {
  createChangelogEntry,
  deleteChangelogEntry,
  fetchChangelogDetail,
  fetchChangelogList,
  fetchShippedPosts,
  linkChangelogPosts,
  publishChangelogEntry,
  unlinkChangelogPost,
  updateChangelogEntry,
} from "@/services/changelog-admin"

export function useChangelogListQuery() {
  return useQuery({
    queryKey: queryKeys.changelog.list(),
    queryFn: fetchChangelogList,
  })
}

export function useChangelogDetailQuery(entryId: string) {
  return useQuery({
    queryKey: queryKeys.changelog.detail(entryId),
    queryFn: () => fetchChangelogDetail(entryId),
    enabled: !!entryId,
  })
}

export function useShippedPostsQuery() {
  return useQuery({
    queryKey: ["changelog", "shipped-posts"] as const,
    queryFn: fetchShippedPosts,
  })
}

function invalidateChangelogSurfaces(qc: ReturnType<typeof useQueryClient>, entryId?: string) {
  qc.invalidateQueries({ queryKey: queryKeys.changelog.list() })
  if (entryId) qc.invalidateQueries({ queryKey: queryKeys.changelog.detail(entryId) })
  // Public changelog (workspace-scoped) — invalidate broadly since we don't
  // have the workspace slug in this scope.
  qc.invalidateQueries({ queryKey: ["changelog", "public"] as const })
}

export function useCreateChangelogMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createChangelogEntry,
    onSuccess: () => {
      invalidateChangelogSurfaces(qc)
      toast.success("Draft created")
    },
    onError: (err) =>
      toast.error(describeError(err, "Couldn't create the entry")),
  })
}

export function useUpdateChangelogMutation(entryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { title?: string; body?: string; postIds?: string[] }) =>
      updateChangelogEntry(entryId, body),
    onSuccess: () => {
      invalidateChangelogSurfaces(qc, entryId)
      toast.success("Changes saved")
    },
    onError: (err) =>
      toast.error(describeError(err, "Couldn't save the entry")),
  })
}

export function usePublishChangelogMutation(entryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (published: boolean) => publishChangelogEntry(entryId, { published }),
    onSuccess: (_data, published) => {
      invalidateChangelogSurfaces(qc, entryId)
      toast.success(
        published
          ? "Entry published"
          : "Entry moved back to draft",
      )
    },
    onError: (err) =>
      toast.error(describeError(err, "Couldn't update publish status")),
  })
}

export function useDeleteChangelogMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entryId: string) => deleteChangelogEntry(entryId),
    onSuccess: () => {
      invalidateChangelogSurfaces(qc)
      toast.success("Entry deleted")
    },
    onError: (err) =>
      toast.error(describeError(err, "Couldn't delete the entry")),
  })
}

export function useLinkChangelogPostsMutation(entryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postIds: string[]) => linkChangelogPosts(entryId, { postIds }),
    onSuccess: (_data, postIds) => {
      invalidateChangelogSurfaces(qc, entryId)
      toast.success(
        postIds.length === 1
          ? "Post linked to entry"
          : `${postIds.length} posts linked to entry`,
      )
    },
    onError: (err) =>
      toast.error(describeError(err, "Couldn't link posts")),
  })
}

export function useUnlinkChangelogPostMutation(entryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: string) => unlinkChangelogPost(entryId, postId),
    onSuccess: () => {
      invalidateChangelogSurfaces(qc, entryId)
      toast.success("Post unlinked")
    },
    onError: (err) =>
      toast.error(describeError(err, "Couldn't unlink the post")),
  })
}
