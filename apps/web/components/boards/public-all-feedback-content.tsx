"use client"

import { Input } from "@workspace/ui/components/input"
import { Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { BoardsListCard } from "@/components/boards/boards-list-card"
import { PostList } from "@/components/boards/post-list"
import { PublicFooter } from "@/components/boards/public-footer"
import { PublicSidebar } from "@/components/boards/public-sidebar"
import { PublicTopBar } from "@/components/boards/public-top-bar"
import { SortPills, type SortOption } from "@/components/boards/sort-pills"
import type { PostRow } from "@/components/boards/types"
import { InfiniteScrollSentinel } from "@/components/common/infinite-scroll-sentinel"
import { PageEnter } from "@/components/common/page-enter"
import {
  useAllFeedbackPostsInfiniteQuery,
  useAllFeedbackQuery,
} from "@/hooks/queries/use-all-feedback"

// "All feedback" workspace-root view. Renders the same chrome as the
// per-board page but the main column shows posts pulled from every
// public board, each tagged with its source board. The submit-post CTA
// is hidden — visitors pick a specific board (via the sidebar) before
// submitting.
export function PublicAllFeedbackContent({
  workspaceSlug,
}: {
  workspaceSlug: string
}) {
  const meta = useAllFeedbackQuery(workspaceSlug)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sort, setSort] = useState<SortOption>("votes")

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => clearTimeout(t)
  }, [search])

  const postsQuery = useAllFeedbackPostsInfiniteQuery({
    workspaceSlug,
    sort,
    search: debouncedSearch,
  })

  const posts: PostRow[] = useMemo(
    () => postsQuery.data?.pages.flatMap((p) => p.posts) ?? [],
    [postsQuery.data],
  )

  if (!meta.data) return null

  // Roadmap/Changelog tabs anchor to the first public board since those
  // views are inherently per-board.
  const anchorBoard = meta.data.workspaceBoards[0]
  const anchorBoardSlug = anchorBoard?.slug ?? ""
  const anchorBoardId = anchorBoard?.id ?? ""

  return (
    <div className="min-h-svh bg-[var(--surface-3)] text-foreground">
      <PublicTopBar
        workspaceName={meta.data.workspace.name}
        workspaceSlug={meta.data.workspace.slug}
        workspaceId={meta.data.workspace.id}
        workspaceOwnerId={meta.data.workspace.ownerId}
        boardSlug={anchorBoardSlug}
        boardId={anchorBoardId}
        activeTab="feedback"
        submitBoardOptions={meta.data.workspaceBoards}
      />

      <PageEnter className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col-reverse gap-8 lg:flex-row">
          <PublicSidebar className="lg:w-60 lg:flex-shrink-0">
            <BoardsListCard
              boards={meta.data.workspaceBoards}
              workspaceSlug={meta.data.workspace.slug}
              activeBoardSlug={null}
            />
          </PublicSidebar>

          <main className="min-w-0 flex-1">
            <header className="mb-7">
              <h1 className="text-2xl font-medium -tracking-[0.02em]">
                All feedback
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Every request across {meta.data.workspaceBoards.length}{" "}
                {meta.data.workspaceBoards.length === 1 ? "board" : "boards"}.
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
                workspaceSlug={meta.data.workspace.slug}
                boardSlug=""
                workspaceId={meta.data.workspace.id}
                workspaceOwnerId={meta.data.workspace.ownerId}
              />
              <InfiniteScrollSentinel
                hasNextPage={postsQuery.hasNextPage ?? false}
                isFetchingNextPage={postsQuery.isFetchingNextPage}
                onLoadMore={() => postsQuery.fetchNextPage()}
              />
            </div>
          </main>
        </div>
      </PageEnter>

      <PublicFooter />
    </div>
  )
}
