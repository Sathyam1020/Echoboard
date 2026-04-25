import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PublicChangelogEntryContent } from "@/components/changelog/public-changelog-entry-content"
import { ApiError } from "@/lib/http/api-error"
import { makeQueryClient } from "@/lib/query/query-client"
import { queryKeys } from "@/lib/query/keys"
import { absoluteUrl } from "@/lib/seo"
import { fetchBoardBySlugSSR } from "@/services/boards.server"
import {
  fetchPublicChangelogEntriesSSR,
  fetchPublicChangelogSSR,
} from "@/services/changelog.server"

type RouteParams = {
  workspaceSlug: string
  boardSlug: string
  entryId: string
}

// Pull the full entries list (one page is enough for v1; if the entry
// is older than ~10 entries deep, we'd need to paginate looking for it.
// For now, the detail page always shows entries from the first page.).
async function findEntryFirstPage(
  workspaceSlug: string,
  entryId: string,
) {
  const page = await fetchPublicChangelogEntriesSSR({ workspaceSlug })
  return {
    page,
    entry: page.entries.find((e) => e.id === entryId) ?? null,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { workspaceSlug, boardSlug, entryId } = await params
  try {
    const [meta, found] = await Promise.all([
      fetchPublicChangelogSSR(workspaceSlug),
      findEntryFirstPage(workspaceSlug, entryId),
    ])
    if (!found.entry) return { title: "Changelog entry not found" }
    const entry = found.entry
    const title = `${entry.title} — ${meta.workspace.name}`
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
            `/og?title=${encodeURIComponent(entry.title)}&description=${encodeURIComponent(`Changelog · ${meta.workspace.name}`)}&type=board`,
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

  try {
    const [board, changelogMeta, found] = await Promise.all([
      fetchBoardBySlugSSR({ workspaceSlug, boardSlug }),
      fetchPublicChangelogSSR(workspaceSlug),
      findEntryFirstPage(workspaceSlug, entryId),
    ])
    if (!found.entry) notFound()
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
      { pages: [found.page], pageParams: [null] },
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
