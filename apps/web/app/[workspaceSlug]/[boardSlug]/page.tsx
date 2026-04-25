import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PublicBoardContent } from "@/components/boards/public-board-content"
import { ApiError } from "@/lib/http/api-error"
import { makeQueryClient } from "@/lib/query/query-client"
import { queryKeys } from "@/lib/query/keys"
import { absoluteUrl } from "@/lib/seo"
import { fetchBoardBySlugSSR } from "@/services/boards.server"

type RouteParams = { workspaceSlug: string; boardSlug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { workspaceSlug, boardSlug } = await params
  try {
    const data = await fetchBoardBySlugSSR({ workspaceSlug, boardSlug })
    const title = `${data.board.name} — ${data.workspace.name} Feedback`
    const description = `Vote on feature requests and see what's planned for ${data.workspace.name}. ${data.posts.length} ${data.posts.length === 1 ? "post" : "posts"} · submit your ideas.`
    const url = absoluteUrl(`/${workspaceSlug}/${boardSlug}`)
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title: `${data.board.name} — ${data.workspace.name}`,
        description,
        type: "website",
        url,
        images: [
          absoluteUrl(
            `/og?title=${encodeURIComponent(`${data.board.name} — ${data.workspace.name}`)}&description=${encodeURIComponent(`${data.posts.length} feature requests`)}&type=board`,
          ),
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
      robots: { index: true, follow: true },
    }
  } catch {
    return { title: "Board not found" }
  }
}

export default async function BoardPage({
  params,
}: {
  params: Promise<RouteParams>
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
