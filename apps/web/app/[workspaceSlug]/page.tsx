import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PublicAllFeedbackContent } from "@/components/boards/public-all-feedback-content"
import { ApiError } from "@/lib/http/api-error"
import { makeQueryClient } from "@/lib/query/query-client"
import { queryKeys } from "@/lib/query/keys"
import { absoluteUrl } from "@/lib/seo"
import {
  fetchAllFeedbackPostsSSR,
  fetchAllFeedbackSSR,
} from "@/services/boards.server"

type RouteParams = { workspaceSlug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { workspaceSlug } = await params
  try {
    const data = await fetchAllFeedbackSSR(workspaceSlug)
    const title = `All feedback — ${data.workspace.name}`
    const description = `Feature requests and feedback across every public board in ${data.workspace.name}.`
    const url = absoluteUrl(`/${workspaceSlug}`)
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
            `/og?title=${encodeURIComponent(`All feedback — ${data.workspace.name}`)}&description=${encodeURIComponent("All boards · all requests")}&type=board`,
          ),
        ],
      },
      twitter: { card: "summary_large_image", title, description },
      robots: { index: true, follow: true },
    }
  } catch {
    return { title: "Workspace not found" }
  }
}

export default async function PublicAllFeedbackPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { workspaceSlug } = await params

  const queryClient = makeQueryClient()

  try {
    // Default initial sort = "votes" matches `PublicAllFeedbackContent`.
    const [meta, postsPage] = await Promise.all([
      fetchAllFeedbackSSR(workspaceSlug),
      fetchAllFeedbackPostsSSR({ workspaceSlug, sort: "votes" }),
    ])
    queryClient.setQueryData(
      queryKeys.boards.allFeedback(workspaceSlug),
      meta,
    )
    queryClient.setQueryData(
      queryKeys.boards.allFeedbackPosts(workspaceSlug, "votes", ""),
      { pages: [postsPage], pageParams: [null] },
    )
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PublicAllFeedbackContent workspaceSlug={workspaceSlug} />
    </HydrationBoundary>
  )
}
