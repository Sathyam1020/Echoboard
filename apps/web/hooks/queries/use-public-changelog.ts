"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import { fetchPublicChangelog } from "@/services/changelog"

export function usePublicChangelogQuery(workspaceSlug: string) {
  return useQuery({
    queryKey: queryKeys.changelog.publicByWorkspace(workspaceSlug),
    queryFn: () => fetchPublicChangelog(workspaceSlug),
  })
}
