import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { notFound } from "next/navigation"

import { PublicBoardContent } from "@/components/boards/public-board-content"
import { ApiError } from "@/lib/http/api-error"
import { makeQueryClient } from "@/lib/query/query-client"
import { queryKeys } from "@/lib/query/keys"
import { fetchBoardBySlugSSR } from "@/services/boards.server"

export default async function BoardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; boardSlug: string }>
}) {
  const { workspaceSlug, boardSlug } = await params

  // Per-request query client (singletons leak data between requests on the
  // server). Prefetch the board + sibling boards + posts in one shot so the
  // hydrated client component can read everything from cache.
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
      <PublicBoardContent
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
      />
    </HydrationBoundary>
  )
}
