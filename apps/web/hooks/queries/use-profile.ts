"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import {
  fetchProfile,
  fetchProfileComments,
  fetchProfileFeedback,
} from "@/services/profile"

export function useProfileQuery(args: {
  workspaceSlug: string
  actorId: string
}) {
  return useQuery({
    queryKey: queryKeys.profile.detail(args.workspaceSlug, args.actorId),
    queryFn: () => fetchProfile(args),
  })
}

export function useProfileFeedbackInfiniteQuery(args: {
  workspaceSlug: string
  actorId: string
}) {
  return useInfiniteQuery({
    queryKey: queryKeys.profile.feedback(args.workspaceSlug, args.actorId),
    queryFn: ({ pageParam }) =>
      fetchProfileFeedback({
        workspaceSlug: args.workspaceSlug,
        actorId: args.actorId,
        cursor: pageParam,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}

export function useProfileCommentsInfiniteQuery(args: {
  workspaceSlug: string
  actorId: string
}) {
  return useInfiniteQuery({
    queryKey: queryKeys.profile.comments(args.workspaceSlug, args.actorId),
    queryFn: ({ pageParam }) =>
      fetchProfileComments({
        workspaceSlug: args.workspaceSlug,
        actorId: args.actorId,
        cursor: pageParam,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}
