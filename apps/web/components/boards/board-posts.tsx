"use client"

import { Input } from "@workspace/ui/components/input"
import { Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { InfiniteScrollSentinel } from "@/components/common/infinite-scroll-sentinel"
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

      <PostList
        posts={posts}
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
        workspaceId={workspaceId}
        workspaceOwnerId={workspaceOwnerId}
      />

      <InfiniteScrollSentinel
        hasNextPage={query.hasNextPage ?? false}
        isFetchingNextPage={query.isFetchingNextPage}
        onLoadMore={() => query.fetchNextPage()}
      />
    </div>
  )
}
