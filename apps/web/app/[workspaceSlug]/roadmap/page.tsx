import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PublicRoadmapContent } from "@/components/roadmap/public-roadmap-content"
import { ApiError } from "@/lib/http/api-error"
import { makeQueryClient } from "@/lib/query/query-client"
import { queryKeys } from "@/lib/query/keys"
import { absoluteUrl } from "@/lib/seo"
import { fetchPublicWorkspaceRoadmapSSR } from "@/services/workspaces.server"

type RouteParams = { workspaceSlug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { workspaceSlug } = await params
  try {
    const data = await fetchPublicWorkspaceRoadmapSSR({ workspaceSlug })
    const title = `Roadmap — ${data.workspace.name}`
    const description = `What ${data.workspace.name} is shipping next, across every board.`
    const url = absoluteUrl(`/${workspaceSlug}/roadmap`)
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
            `/og?title=${encodeURIComponent(`Roadmap — ${data.workspace.name}`)}&description=${encodeURIComponent("What we're shipping")}&type=board`,
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
  const { workspaceSlug } = await params

  const queryClient = makeQueryClient()
  try {
    const roadmap = await fetchPublicWorkspaceRoadmapSSR({ workspaceSlug })
    queryClient.setQueryData(
      queryKeys.workspaces.publicRoadmap(workspaceSlug),
      roadmap,
    )
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PublicRoadmapContent workspaceSlug={workspaceSlug} />
    </HydrationBoundary>
  )
}
