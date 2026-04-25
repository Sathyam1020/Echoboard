"use client"

import { PublicFooter } from "@/components/boards/public-footer"
import { PublicSidebar } from "@/components/boards/public-sidebar"
import { PublicTopBar } from "@/components/boards/public-top-bar"
import { PageEnter } from "@/components/common/page-enter"
import { PublicRoadmap } from "@/components/roadmap/public-roadmap"
import { RoadmapStatsCard } from "@/components/roadmap/roadmap-stats-card"
import { useBoardBySlugQuery } from "@/hooks/queries/use-board-by-slug"

export function PublicRoadmapContent({
  workspaceSlug,
  boardSlug,
}: {
  workspaceSlug: string
  boardSlug: string
}) {
  const { data } = useBoardBySlugQuery({ workspaceSlug, boardSlug })
  if (!data) return null

  return (
    <div className="min-h-svh bg-[var(--surface-3)] text-foreground">
      <PublicTopBar
        workspaceName={data.workspace.name}
        workspaceSlug={data.workspace.slug}
        workspaceId={data.workspace.id}
        workspaceOwnerId={data.workspace.ownerId}
        boardSlug={data.board.slug}
        boardId={data.board.id}
        activeTab="roadmap"
      />

      <PageEnter className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col-reverse gap-8 lg:flex-row">
          <PublicSidebar className="lg:w-60 lg:flex-shrink-0">
            <RoadmapStatsCard posts={data.posts} />
          </PublicSidebar>

          <main className="min-w-0 flex-1">
            <header className="mb-7">
              <h1 className="text-2xl font-medium -tracking-[0.02em]">
                Roadmap
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                What&apos;s planned, in progress, and recently shipped.
              </p>
            </header>

            <PublicRoadmap
              posts={data.posts}
              workspaceSlug={data.workspace.slug}
              boardSlug={data.board.slug}
            />
          </main>
        </div>
      </PageEnter>

      <PublicFooter />
    </div>
  )
}
