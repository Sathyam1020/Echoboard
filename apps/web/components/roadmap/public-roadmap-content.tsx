"use client"

import { PublicFooter } from "@/components/boards/public-footer"
import { PublicSidebar } from "@/components/boards/public-sidebar"
import { PublicTopBar } from "@/components/boards/public-top-bar"
import { PageEnter } from "@/components/common/page-enter"
import { PublicRoadmap } from "@/components/roadmap/public-roadmap"
import { RoadmapStatsCard } from "@/components/roadmap/roadmap-stats-card"
import { useWorkspacePublicRoadmapQuery } from "@/hooks/queries/use-workspace-roadmap"

export function PublicRoadmapContent({
  workspaceSlug,
}: {
  workspaceSlug: string
}) {
  const { data } = useWorkspacePublicRoadmapQuery({ workspaceSlug })
  if (!data) return null

  return (
    <div className="min-h-svh bg-[var(--surface-3)] text-foreground">
      <PublicTopBar
        workspaceName={data.workspace.name}
        workspaceSlug={data.workspace.slug}
        workspaceId={data.workspace.id}
        workspaceOwnerId={data.workspace.ownerId}
        boardSlug={data.firstBoard?.slug}
        boardId={data.firstBoard?.id}
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
                What&apos;s planned, in progress, and recently shipped across
                every board.
              </p>
            </header>

            <PublicRoadmap
              posts={data.posts}
              workspaceSlug={data.workspace.slug}
            />
          </main>
        </div>
      </PageEnter>

      <PublicFooter />
    </div>
  )
}
