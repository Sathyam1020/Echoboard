"use client"

import { Input } from "@workspace/ui/components/input"
import { Search } from "lucide-react"
import { useMemo, useState } from "react"

import { BoardsListCard } from "@/components/boards/boards-list-card"
import { PostList } from "@/components/boards/post-list"
import { PublicFooter } from "@/components/boards/public-footer"
import { PublicSidebar } from "@/components/boards/public-sidebar"
import { PublicTopBar } from "@/components/boards/public-top-bar"
import { SortPills, type SortOption } from "@/components/boards/sort-pills"
import type { PostRow } from "@/components/boards/types"
import { PageEnter } from "@/components/common/page-enter"
import { useAllFeedbackQuery } from "@/hooks/queries/use-all-feedback"

// "All feedback" workspace-root view. Renders the same chrome as the
// per-board page (TopBar + sidebar + main) but the main column shows
// posts pulled from every public board, each tagged with its source
// board. The submit-post CTA is hidden — visitors pick a specific
// board (via the sidebar) before submitting.
export function PublicAllFeedbackContent({
  workspaceSlug,
}: {
  workspaceSlug: string
}) {
  const { data } = useAllFeedbackQuery(workspaceSlug)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortOption>("votes")

  const posts: PostRow[] = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    let arr: PostRow[] = data.posts
    if (q) {
      arr = arr.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      )
    }
    const sorter = (a: PostRow, b: PostRow) => {
      if (sort === "votes") {
        const diff = b.voteCount - a.voteCount
        if (diff !== 0) return diff
        return b.createdAt.localeCompare(a.createdAt)
      }
      const cmp = a.createdAt.localeCompare(b.createdAt)
      return sort === "newest" ? -cmp : cmp
    }
    const pinned = arr.filter((p) => p.pinnedAt)
    const rest = arr.filter((p) => !p.pinnedAt)
    pinned.sort(sorter)
    rest.sort(sorter)
    return [...pinned, ...rest]
  }, [data, search, sort])

  if (!data) return null

  // The all-feedback view has no inherent board, but the top bar's
  // Roadmap/Changelog tabs still need an anchor — use the first public
  // board. If a workspace has no public boards yet, those tabs simply
  // 404 (which is the correct behavior — there's nothing to show).
  // Roadmap/Changelog tabs anchor to the first public board since those
  // views are inherently per-board. If the workspace has no public
  // boards yet, those tabs will 404 (correct — nothing to show).
  const anchorBoard = data.workspaceBoards[0]
  const anchorBoardSlug = anchorBoard?.slug ?? ""
  const anchorBoardId = anchorBoard?.id ?? ""

  return (
    <div className="min-h-svh bg-[var(--surface-3)] text-foreground">
      <PublicTopBar
        workspaceName={data.workspace.name}
        workspaceSlug={data.workspace.slug}
        workspaceId={data.workspace.id}
        workspaceOwnerId={data.workspace.ownerId}
        boardSlug={anchorBoardSlug}
        boardId={anchorBoardId}
        activeTab="feedback"
        hideSubmitDialog
      />

      <PageEnter className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col-reverse gap-8 lg:flex-row">
          <PublicSidebar className="lg:w-60 lg:flex-shrink-0">
            <BoardsListCard
              boards={data.workspaceBoards}
              workspaceSlug={data.workspace.slug}
              activeBoardSlug={null}
            />
          </PublicSidebar>

          <main className="min-w-0 flex-1">
            <header className="mb-7">
              <h1 className="text-2xl font-medium -tracking-[0.02em]">
                All feedback
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Every request across {data.workspaceBoards.length}{" "}
                {data.workspaceBoards.length === 1 ? "board" : "boards"}.
                Filter or sort to find what matters.
              </p>
            </header>

            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search across all boards…"
                  className="pl-10"
                />
              </div>
              <SortPills value={sort} onChange={setSort} />
              <PostList
                posts={posts}
                workspaceSlug={data.workspace.slug}
                boardSlug=""
                workspaceId={data.workspace.id}
                workspaceOwnerId={data.workspace.ownerId}
              />
            </div>
          </main>
        </div>
      </PageEnter>

      <PublicFooter />
    </div>
  )
}
