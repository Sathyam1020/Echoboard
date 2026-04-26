"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Inbox, Search, SearchX } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { EmptyHint } from "@/components/common/empty-hint"
import { InfiniteScrollSentinel } from "@/components/common/infinite-scroll-sentinel"
import { PostCardSkeletonList } from "@/components/skeletons/post-card-skeleton"
import { useBoardPostsInfiniteQuery } from "@/hooks/queries/use-board-posts"

import { PostList } from "./post-list"
import { SortPills, type SortOption } from "./sort-pills"
import { SubmitPostDialog } from "./submit-post-dialog"
import type { PostRow } from "./types"

export function BoardPosts({
  boardId,
  workspaceId,
  workspaceOwnerId,
  workspaceSlug,
  boardSlug,
}: {
  boardId: string
  workspaceId: string
  workspaceOwnerId: string
  workspaceSlug: string
  boardSlug: string
}) {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sort, setSort] = useState<SortOption>("newest")

  // Debounce the search so each keystroke doesn't fire a network
  // request — search is in the queryKey, so it'd refetch otherwise.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => clearTimeout(t)
  }, [search])

  const query = useBoardPostsInfiniteQuery({
    workspaceSlug,
    boardSlug,
    sort,
    search: debouncedSearch,
  })

  const posts: PostRow[] = useMemo(
    () => query.data?.pages.flatMap((p) => p.posts) ?? [],
    [query.data],
  )

  // Three branches we need to render:
  //   1. Loading (cache cold + no data yet)         → skeleton list
  //   2. Search active + no matches                  → search-empty state
  //   3. No search + zero posts                      → board-empty state
  // Default: render the actual post list.
  const isInitialLoading = query.isPending && !query.data
  const isEmpty = !isInitialLoading && posts.length === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feedback…"
            className="pl-10"
          />
        </div>
        <SubmitPostDialog
          boardId={boardId}
          workspaceId={workspaceId}
          workspaceOwnerId={workspaceOwnerId}
        />
      </div>

      <SortPills value={sort} onChange={setSort} />

      {isInitialLoading ? (
        <PostCardSkeletonList />
      ) : isEmpty ? (
        debouncedSearch ? (
          <EmptyHint
            icon={SearchX}
            title="No matching feedback"
            description={
              <>
                Nothing turned up for{" "}
                <span className="font-medium text-foreground">
                  &ldquo;{debouncedSearch}&rdquo;
                </span>
                . Try a different keyword.
              </>
            }
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearch("")}
              >
                Clear search
              </Button>
            }
          />
        ) : (
          <EmptyHint
            icon={Inbox}
            title="Be the first to ask"
            description="When someone submits a feature request to this board, it'll appear here."
          />
        )
      ) : (
        <PostList
          posts={posts}
          workspaceSlug={workspaceSlug}
          boardSlug={boardSlug}
          workspaceId={workspaceId}
          workspaceOwnerId={workspaceOwnerId}
        />
      )}

      {!isInitialLoading && !isEmpty ? (
        <InfiniteScrollSentinel
          hasNextPage={query.hasNextPage ?? false}
          isFetchingNextPage={query.isFetchingNextPage}
          onLoadMore={() => query.fetchNextPage()}
        />
      ) : null}
    </div>
  )
}
