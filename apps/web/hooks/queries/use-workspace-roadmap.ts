"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import {
  fetchPublicWorkspaceRoadmap,
  fetchWorkspaceRoadmap,
} from "@/services/workspaces"

// Workspace-wide admin roadmap. Aggregates planned + progress + 50
// most-recent shipped across every board in the workspace. Non-
// paginated by design — the roadmap groups by status, so all rows must
// arrive up front.
export function useWorkspaceRoadmapQuery(args: { workspaceSlug: string }) {
  return useQuery({
    queryKey: queryKeys.workspaces.roadmap(args.workspaceSlug),
    queryFn: () => fetchWorkspaceRoadmap(args),
  })
}

// Public sibling — no auth required; the backend filters to public-
// board posts only. Powers `/<workspaceSlug>/roadmap`.
export function useWorkspacePublicRoadmapQuery(args: { workspaceSlug: string }) {
  return useQuery({
    queryKey: queryKeys.workspaces.publicRoadmap(args.workspaceSlug),
    queryFn: () => fetchPublicWorkspaceRoadmap(args),
  })
}
