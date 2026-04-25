import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { notFound } from "next/navigation"

import { PublicRoadmapContent } from "@/components/roadmap/public-roadmap-content"
import { ApiError } from "@/lib/http/api-error"
import { makeQueryClient } from "@/lib/query/query-client"
import { queryKeys } from "@/lib/query/keys"
import { fetchBoardBySlugSSR } from "@/services/boards.server"

export default async function PublicRoadmapPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; boardSlug: string }>
}) {
  const { workspaceSlug, boardSlug } = await params

  // Same cache key as the Feedback page — navigating Feedback ↔ Roadmap
  // hits the cache instead of refetching.
  const queryClient = makeQueryClient()
  const cacheKey = queryKeys.boards.bySlug(workspaceSlug, boardSlug)

  try {
    const data = await fetchBoardBySlugSSR({ workspaceSlug, boardSlug })
    queryClient.setQueryData(cacheKey, data)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PublicRoadmapContent
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
      />
    </HydrationBoundary>
  )
}
