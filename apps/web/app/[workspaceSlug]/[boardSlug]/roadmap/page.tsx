import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PublicRoadmapContent } from "@/components/roadmap/public-roadmap-content"
import { ApiError } from "@/lib/http/api-error"
import { makeQueryClient } from "@/lib/query/query-client"
import { queryKeys } from "@/lib/query/keys"
import { absoluteUrl } from "@/lib/seo"
import { fetchBoardRoadmapSSR } from "@/services/boards.server"

type RouteParams = { workspaceSlug: string; boardSlug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { workspaceSlug, boardSlug } = await params
  try {
    const data = await fetchBoardRoadmapSSR({ workspaceSlug, boardSlug })
    const title = `Roadmap — ${data.workspace.name}`
    const description = `What's planned, in progress, and recently shipped for ${data.workspace.name}.`
    const url = absoluteUrl(`/${workspaceSlug}/${boardSlug}/roadmap`)
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        type: "website",
        url,
        images: [
          absoluteUrl(
            `/og?title=${encodeURIComponent(`Roadmap — ${data.workspace.name}`)}&description=${encodeURIComponent("What's planned, in progress, and shipped")}&type=board`,
          ),
        ],
      },
      twitter: { card: "summary_large_image", title, description },
      robots: { index: true, follow: true },
    }
  } catch {
    return { title: "Roadmap not found" }
  }
}

export default async function PublicRoadmapPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { workspaceSlug, boardSlug } = await params

  const queryClient = makeQueryClient()
  const cacheKey = queryKeys.boards.roadmap(workspaceSlug, boardSlug)

  try {
    const data = await fetchBoardRoadmapSSR({ workspaceSlug, boardSlug })
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
