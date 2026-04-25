import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PublicChangelogEntryContent } from "@/components/changelog/public-changelog-entry-content"
import { ApiError } from "@/lib/http/api-error"
import { makeQueryClient } from "@/lib/query/query-client"
import { queryKeys } from "@/lib/query/keys"
import { absoluteUrl } from "@/lib/seo"
import { fetchBoardBySlugSSR } from "@/services/boards.server"
import { fetchPublicChangelogSSR } from "@/services/changelog.server"

type RouteParams = {
  workspaceSlug: string
  boardSlug: string
  entryId: string
}

// Slice the entry out of the prefetched changelog list — same data,
// no extra round-trip. Returns null if the entry doesn't exist or
// isn't published.
function findEntry(
  entries: Awaited<ReturnType<typeof fetchPublicChangelogSSR>>["entries"],
  entryId: string,
) {
  return entries.find((e) => e.id === entryId) ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { workspaceSlug, boardSlug, entryId } = await params
  try {
    const changelog = await fetchPublicChangelogSSR(workspaceSlug)
    const entry = findEntry(changelog.entries, entryId)
    if (!entry) return { title: "Changelog entry not found" }
    const title = `${entry.title} — ${changelog.workspace.name}`
    const description = entry.body
      .replace(/[#`*_>~\[\]]+/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 155)
    const url = absoluteUrl(
      `/${workspaceSlug}/${boardSlug}/changelog/${entryId}`,
    )
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        type: "article",
        url,
        publishedTime: entry.publishedAt ?? undefined,
        images: [
          absoluteUrl(
            `/og?title=${encodeURIComponent(entry.title)}&description=${encodeURIComponent(`Changelog · ${changelog.workspace.name}`)}&type=board`,
          ),
        ],
      },
      twitter: { card: "summary_large_image", title, description },
      robots: { index: true, follow: true },
    }
  } catch {
    return { title: "Changelog entry not found" }
  }
}

export default async function PublicChangelogEntryPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { workspaceSlug, boardSlug, entryId } = await params

  const queryClient = makeQueryClient()

  // Both prefetches run in parallel — same shape as the list page.
  // The entry detail is sliced from the changelog list response.
  try {
    const [board, changelog] = await Promise.all([
      fetchBoardBySlugSSR({ workspaceSlug, boardSlug }),
      fetchPublicChangelogSSR(workspaceSlug),
    ])
    const entry = findEntry(changelog.entries, entryId)
    if (!entry) notFound()
    queryClient.setQueryData(
      queryKeys.boards.bySlug(workspaceSlug, boardSlug),
      board,
    )
    queryClient.setQueryData(
      queryKeys.changelog.publicByWorkspace(workspaceSlug),
      changelog,
    )
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PublicChangelogEntryContent
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
        entryId={entryId}
      />
    </HydrationBoundary>
  )
}
