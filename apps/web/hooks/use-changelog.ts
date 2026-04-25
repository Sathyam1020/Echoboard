"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
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
    onSuccess: () => invalidateChangelogSurfaces(qc),
  })
}

export function useUpdateChangelogMutation(entryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { title?: string; body?: string; postIds?: string[] }) =>
      updateChangelogEntry(entryId, body),
    onSuccess: () => invalidateChangelogSurfaces(qc, entryId),
  })
}

export function usePublishChangelogMutation(entryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (published: boolean) => publishChangelogEntry(entryId, { published }),
    onSuccess: () => invalidateChangelogSurfaces(qc, entryId),
  })
}

export function useDeleteChangelogMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entryId: string) => deleteChangelogEntry(entryId),
    onSuccess: () => invalidateChangelogSurfaces(qc),
  })
}

export function useLinkChangelogPostsMutation(entryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postIds: string[]) => linkChangelogPosts(entryId, { postIds }),
    onSuccess: () => invalidateChangelogSurfaces(qc, entryId),
  })
}

export function useUnlinkChangelogPostMutation(entryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: string) => unlinkChangelogPost(entryId, postId),
    onSuccess: () => invalidateChangelogSurfaces(qc, entryId),
  })
}
