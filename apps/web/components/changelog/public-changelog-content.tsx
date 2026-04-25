"use client"

import { useMemo } from "react"

import { PublicFooter } from "@/components/boards/public-footer"
import { PublicSidebar } from "@/components/boards/public-sidebar"
import { PublicTopBar } from "@/components/boards/public-top-bar"
import { ProductActivityCard } from "@/components/changelog/product-activity-card"
import { PublicChangelog } from "@/components/changelog/public-changelog"
import { InfiniteScrollSentinel } from "@/components/common/infinite-scroll-sentinel"
import { PageEnter } from "@/components/common/page-enter"
import { useBoardBySlugQuery } from "@/hooks/queries/use-board-by-slug"
import {
  usePublicChangelogEntriesInfiniteQuery,
  usePublicChangelogQuery,
} from "@/hooks/queries/use-public-changelog"

export function PublicChangelogContent({
  workspaceSlug,
  boardSlug,
}: {
  workspaceSlug: string
  boardSlug: string
}) {
  // Three queries — board (top bar tabs anchored to this board),
  // changelog meta (workspace + firstBoard), and changelog entries
  // (paginated). All prefetched on the server.
  const board = useBoardBySlugQuery({ workspaceSlug, boardSlug })
  const changelog = usePublicChangelogQuery(workspaceSlug)
  const entriesQuery = usePublicChangelogEntriesInfiniteQuery(workspaceSlug)

  const entries = useMemo(
    () => entriesQuery.data?.pages.flatMap((p) => p.entries) ?? [],
    [entriesQuery.data],
  )

  if (!board.data || !changelog.data) return null

  return (
    <div className="min-h-svh bg-[var(--surface-3)] text-foreground">
      <PublicTopBar
        workspaceName={board.data.workspace.name}
        workspaceSlug={board.data.workspace.slug}
        workspaceId={board.data.workspace.id}
        workspaceOwnerId={board.data.workspace.ownerId}
        boardSlug={board.data.board.slug}
        boardId={board.data.board.id}
        activeTab="changelog"
      />

      <PageEnter className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col-reverse gap-8 lg:flex-row">
          <PublicSidebar className="lg:w-60 lg:flex-shrink-0">
            <ProductActivityCard entries={entries} />
          </PublicSidebar>

          <main className="min-w-0 flex-1">
            <header className="mb-7">
              <h1 className="text-2xl font-medium -tracking-[0.02em]">
                Changelog
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                What&apos;s new — recent updates and ships.
              </p>
            </header>

            <PublicChangelog
              entries={entries}
              workspaceSlug={changelog.data.workspace.slug}
              boardSlug={board.data.board.slug}
            />

            <InfiniteScrollSentinel
              hasNextPage={entriesQuery.hasNextPage ?? false}
              isFetchingNextPage={entriesQuery.isFetchingNextPage}
              onLoadMore={() => entriesQuery.fetchNextPage()}
            />
          </main>
        </div>
      </PageEnter>

      <PublicFooter />
    </div>
  )
}
