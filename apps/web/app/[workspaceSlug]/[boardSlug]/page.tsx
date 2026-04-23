import { notFound } from "next/navigation"

import { BoardPosts } from "@/components/boards/board-posts"
import type { PostRow } from "@/components/boards/types"
import { PublicFooter } from "@/components/boards/public-footer"
import { PublicTopBar } from "@/components/boards/public-top-bar"
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
    <div className="min-h-svh bg-background text-foreground">
      <PublicTopBar
        workspaceName={data.workspace.name}
        boardId={data.board.id}
      />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-7">
          <h1 className="text-2xl font-medium -tracking-[0.02em]">
            {data.board.name === "Feature Requests"
              ? "What should we build next?"
              : data.board.name}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Vote on ideas, submit your own, or comment on what&apos;s important
            to you.
          </p>
        </header>

        <BoardPosts boardId={data.board.id} posts={data.posts} />
      </div>

      <PublicFooter />
    </div>
  )
}
