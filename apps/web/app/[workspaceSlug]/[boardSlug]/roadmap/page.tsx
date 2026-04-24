import { notFound } from "next/navigation"

import { PublicFooter } from "@/components/boards/public-footer"
import { PublicTopBar } from "@/components/boards/public-top-bar"
import type { PostRow } from "@/components/boards/types"
import { PublicRoadmap } from "@/components/roadmap/public-roadmap"
import { ApiError, serverApi } from "@/lib/api"

type BoardPageData = {
  workspace: { id: string; name: string; slug: string }
  board: {
    id: string
    name: string
    slug: string
    visibility: string
  }
  posts: PostRow[]
}

export default async function PublicRoadmapPage({
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
        boardSlug={data.board.slug}
        boardId={data.board.id}
        activeTab="roadmap"
      />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-7">
          <h1 className="text-2xl font-medium -tracking-[0.02em]">Roadmap</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            What&apos;s planned, in progress, and recently shipped.
          </p>
        </header>

        <PublicRoadmap
          posts={data.posts}
          workspaceSlug={workspaceSlug}
          boardSlug={boardSlug}
        />
      </div>

      <PublicFooter />
    </div>
  )
}
