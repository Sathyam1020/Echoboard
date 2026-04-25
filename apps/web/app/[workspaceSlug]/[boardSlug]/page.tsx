import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PublicBoardContent } from "@/components/boards/public-board-content"
import { ApiError } from "@/lib/http/api-error"
import { makeQueryClient } from "@/lib/query/query-client"
import { queryKeys } from "@/lib/query/keys"
import { absoluteUrl } from "@/lib/seo"
import {
  fetchBoardBySlugSSR,
  fetchBoardPostsSSR,
} from "@/services/boards.server"

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
    const description = `Vote on feature requests and see what's planned for ${data.workspace.name}. Submit your ideas.`
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
            `/og?title=${encodeURIComponent(`${data.board.name} — ${data.workspace.name}`)}&description=${encodeURIComponent(`Feature requests for ${data.workspace.name}`)}&type=board`,
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

  // Per-request query client (singletons leak data between requests on
  // the server). Prefetch the board metadata + first page of posts in
  // parallel so the hydrated client has everything for first paint.
  const queryClient = makeQueryClient()

  try {
    const [meta, postsPage] = await Promise.all([
      fetchBoardBySlugSSR({ workspaceSlug, boardSlug }),
      // Default sort + empty search match `BoardPosts`'s initial state.
      // The infinite query reads `pages[0]` from this seed; subsequent
      // pages fetch client-side as the user scrolls.
      fetchBoardPostsSSR({ workspaceSlug, boardSlug, sort: "newest" }),
    ])
    queryClient.setQueryData(
      queryKeys.boards.bySlug(workspaceSlug, boardSlug),
      meta,
    )
    queryClient.setQueryData(
      queryKeys.boards.bySlugPosts(workspaceSlug, boardSlug, "newest", ""),
      { pages: [postsPage], pageParams: [null] },
    )
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
