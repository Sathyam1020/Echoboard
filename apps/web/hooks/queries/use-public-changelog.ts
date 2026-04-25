"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import {
  fetchPublicChangelog,
  fetchPublicChangelogEntries,
} from "@/services/changelog"

// Public changelog metadata (workspace + firstBoard). Entries paginate
// through `usePublicChangelogEntriesInfiniteQuery` below.
export function usePublicChangelogQuery(workspaceSlug: string) {
  return useQuery({
    queryKey: queryKeys.changelog.publicByWorkspace(workspaceSlug),
    queryFn: () => fetchPublicChangelog(workspaceSlug),
  })
}

export function usePublicChangelogEntriesInfiniteQuery(workspaceSlug: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.changelog.publicEntries(workspaceSlug),
    queryFn: ({ pageParam }) =>
      fetchPublicChangelogEntries({ workspaceSlug, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}
