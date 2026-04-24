import { notFound } from "next/navigation"

import { PublicFooter } from "@/components/boards/public-footer"
import { PublicTopBar } from "@/components/boards/public-top-bar"
import { PublicChangelog } from "@/components/changelog/public-changelog"
import type { PublicChangelogEntry } from "@/components/changelog/types"
import { ApiError, serverApi } from "@/lib/api"

type PublicChangelogResponse = {
  workspace: { id: string; name: string; slug: string }
  firstBoard: { id: string; name: string; slug: string } | null
  entries: PublicChangelogEntry[]
}

type BoardBySlugResponse = {
  workspace: { id: string; name: string; slug: string }
  board: { id: string; name: string; slug: string; visibility: string }
}

export default async function PublicChangelogPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; boardSlug: string }>
}) {
  const { workspaceSlug, boardSlug } = await params

  // Fetch the board first so the top bar's Feedback/Roadmap tabs anchor to
  // THIS board (the one in the URL) — not whichever board happens to be
  // first in the workspace. The workspace-scoped changelog data comes next.
  let board: BoardBySlugResponse
  try {
    board = await serverApi.get<BoardBySlugResponse>(
      `/api/boards/by-slug/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(boardSlug)}`,
    )
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  let data: PublicChangelogResponse
  try {
    data = await serverApi.get<PublicChangelogResponse>(
      `/api/changelog/public/${encodeURIComponent(workspaceSlug)}`,
    )
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <PublicTopBar
        workspaceName={board.workspace.name}
        workspaceSlug={board.workspace.slug}
        boardSlug={board.board.slug}
        boardId={board.board.id}
        activeTab="changelog"
      />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-7">
          <h1 className="text-2xl font-medium -tracking-[0.02em]">Changelog</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            What&apos;s new — recent updates and ships.
          </p>
        </header>

        <PublicChangelog
          entries={data.entries}
          workspaceSlug={data.workspace.slug}
        />
      </div>

      <PublicFooter />
    </div>
  )
}
