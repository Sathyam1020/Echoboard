import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PublicChangelogContent } from "@/components/changelog/public-changelog-content"
import { ApiError } from "@/lib/http/api-error"
import { makeQueryClient } from "@/lib/query/query-client"
import { queryKeys } from "@/lib/query/keys"
import { absoluteUrl } from "@/lib/seo"
import { fetchBoardBySlugSSR } from "@/services/boards.server"
import {
  fetchPublicChangelogEntriesSSR,
  fetchPublicChangelogSSR,
} from "@/services/changelog.server"

type RouteParams = { workspaceSlug: string; boardSlug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { workspaceSlug, boardSlug } = await params
  try {
    const data = await fetchBoardBySlugSSR({ workspaceSlug, boardSlug })
    const title = `Changelog — ${data.workspace.name}`
    const description = `Recent updates, ships, and product news from ${data.workspace.name}.`
    const url = absoluteUrl(`/${workspaceSlug}/${boardSlug}/changelog`)
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
            `/og?title=${encodeURIComponent(`Changelog — ${data.workspace.name}`)}&description=${encodeURIComponent("Recent updates and ships")}&type=board`,
          ),
        ],
      },
      twitter: { card: "summary_large_image", title, description },
      robots: { index: true, follow: true },
    }
  } catch {
    return { title: "Changelog not found" }
  }
}

export default async function PublicChangelogPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { workspaceSlug, boardSlug } = await params

  const queryClient = makeQueryClient()

  // Three prefetches in parallel — the metadata for the board chrome,
  // the changelog meta, and the first page of entries (paginated).
  try {
    const [board, changelogMeta, entriesPage] = await Promise.all([
      fetchBoardBySlugSSR({ workspaceSlug, boardSlug }),
      fetchPublicChangelogSSR(workspaceSlug),
      fetchPublicChangelogEntriesSSR({ workspaceSlug }),
    ])
    queryClient.setQueryData(
      queryKeys.boards.bySlug(workspaceSlug, boardSlug),
      board,
    )
    queryClient.setQueryData(
      queryKeys.changelog.publicByWorkspace(workspaceSlug),
      changelogMeta,
    )
    queryClient.setQueryData(
      queryKeys.changelog.publicEntries(workspaceSlug),
      { pages: [entriesPage], pageParams: [null] },
    )
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PublicChangelogContent
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
      />
    </HydrationBoundary>
  )
}
