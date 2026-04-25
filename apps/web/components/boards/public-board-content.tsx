"use client"

import { BoardPosts } from "@/components/boards/board-posts"
import { BoardsListCard } from "@/components/boards/boards-list-card"
import { PublicFooter } from "@/components/boards/public-footer"
import { PublicSidebar } from "@/components/boards/public-sidebar"
import { PublicTopBar } from "@/components/boards/public-top-bar"
import { PageEnter } from "@/components/common/page-enter"
import { useBoardBySlugQuery } from "@/hooks/queries/use-board-by-slug"

// Client wrapper for the public board page. Reads board + posts via
// react-query (hydrated from the server prefetch in `page.tsx`), then
// fans out to TopBar, Sidebar, BoardPosts. Living inside react-query
// means vote/comment/post mutations can surgically update the cache and
// the list re-renders without a server round-trip.
export function PublicBoardContent({
  workspaceSlug,
  boardSlug,
}: {
  workspaceSlug: string
  boardSlug: string
}) {
  const { data } = useBoardBySlugQuery({ workspaceSlug, boardSlug })

  // Should never happen in practice — server prefetch populates the cache
  // before HydrationBoundary mounts. Render nothing rather than a flash of
  // empty layout.
  if (!data) return null

  const headline =
    data.board.name === "Feature Requests"
      ? "What should we build next?"
      : data.board.name

  return (
    <div className="min-h-svh bg-[var(--surface-3)] text-foreground">
      <PublicTopBar
        workspaceName={data.workspace.name}
        workspaceSlug={data.workspace.slug}
        workspaceId={data.workspace.id}
        workspaceOwnerId={data.workspace.ownerId}
        boardSlug={data.board.slug}
        boardId={data.board.id}
        activeTab="feedback"
      />

      <PageEnter className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col-reverse gap-8 lg:flex-row">
          <PublicSidebar className="lg:w-60 lg:flex-shrink-0">
            <BoardsListCard
              boards={data.workspaceBoards}
              workspaceSlug={data.workspace.slug}
              activeBoardSlug={data.board.slug}
            />
          </PublicSidebar>

          <main className="min-w-0 flex-1">
            <header className="mb-7">
              <h1 className="text-2xl font-medium -tracking-[0.02em]">
                {headline}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Vote on ideas, submit your own, or comment on what&apos;s
                important to you.
              </p>
            </header>

            <BoardPosts
              boardId={data.board.id}
              workspaceId={data.workspace.id}
              workspaceOwnerId={data.workspace.ownerId}
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
