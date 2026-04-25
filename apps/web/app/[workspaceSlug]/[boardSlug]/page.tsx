import { notFound } from "next/navigation"

import { BoardPosts } from "@/components/boards/board-posts"
import { BoardsListCard } from "@/components/boards/boards-list-card"
import { PublicFooter } from "@/components/boards/public-footer"
import { PublicSidebar } from "@/components/boards/public-sidebar"
import { PublicTopBar } from "@/components/boards/public-top-bar"
import type { PostRow } from "@/components/boards/types"
import { ApiError, serverApi } from "@/lib/api"

type BoardPageData = {
  workspace: { id: string; name: string; slug: string; ownerId: string }
  board: {
    id: string
    name: string
    slug: string
    visibility: string
  }
  posts: PostRow[]
  workspaceBoards: { id: string; name: string; slug: string }[]
}

export default async function BoardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; boardSlug: string }>
}) {
  const { workspaceSlug, boardSlug } = await params

  let data: BoardPageData
  try {
    data = await serverApi.get<BoardPageData>(
      `/api/boards/by-slug/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(boardSlug)}`,
    )
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound()
    }
    throw err
  }

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

      <div className="mx-auto max-w-5xl px-6 py-10">
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
                {data.board.name === "Feature Requests"
                  ? "What should we build next?"
                  : data.board.name}
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
              posts={data.posts}
              workspaceSlug={workspaceSlug}
              boardSlug={boardSlug}
            />
          </main>
        </div>
      </div>

      <PublicFooter />
    </div>
  )
}
