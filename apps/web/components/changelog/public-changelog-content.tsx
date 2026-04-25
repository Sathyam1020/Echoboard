"use client"

import { PublicFooter } from "@/components/boards/public-footer"
import { PublicSidebar } from "@/components/boards/public-sidebar"
import { PublicTopBar } from "@/components/boards/public-top-bar"
import { ProductActivityCard } from "@/components/changelog/product-activity-card"
import { PublicChangelog } from "@/components/changelog/public-changelog"
import { PageEnter } from "@/components/common/page-enter"
import { useBoardBySlugQuery } from "@/hooks/queries/use-board-by-slug"
import { usePublicChangelogQuery } from "@/hooks/queries/use-public-changelog"

export function PublicChangelogContent({
  workspaceSlug,
  boardSlug,
}: {
  workspaceSlug: string
  boardSlug: string
}) {
  // Two queries — board (for the top bar's tabs anchored to this board) and
  // changelog (workspace-scoped, shared across all boards). Both prefetched
  // on the server.
  const board = useBoardBySlugQuery({ workspaceSlug, boardSlug })
  const changelog = usePublicChangelogQuery(workspaceSlug)
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
            <ProductActivityCard entries={changelog.data.entries} />
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
              entries={changelog.data.entries}
              workspaceSlug={changelog.data.workspace.slug}
              boardSlug={board.data.board.slug}
            />
          </main>
        </div>
      </PageEnter>

      <PublicFooter />
    </div>
  )
}
