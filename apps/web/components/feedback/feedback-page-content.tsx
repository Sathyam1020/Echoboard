"use client"

import { Filter, Inbox, X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo } from "react"

import { AdminPageShell } from "@/components/app-shell/admin-page-shell"
import { AppTopbar } from "@/components/app-shell/app-topbar"
import {
  isStatusKey,
  STATUS_LABEL,
  StatusIcon,
  type StatusKey,
} from "@/components/boards/status-icon"
import { EmptyHint } from "@/components/common/empty-hint"
import { InfiniteScrollSentinel } from "@/components/common/infinite-scroll-sentinel"
import { FeedbackList } from "@/components/feedback/feedback-list"
import { NewPostFromTopbar } from "@/components/feedback/new-post-from-topbar"
import { PostCardSkeletonList } from "@/components/skeletons/post-card-skeleton"
import {
  useAdminFeedbackInfiniteQuery,
  useDashboardBoardsQuery,
} from "@/hooks/use-dashboard"

export function FeedbackPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const boardsQuery = useDashboardBoardsQuery()
  const boards = boardsQuery.data?.boards ?? []

  const statusParam = searchParams.get("status") ?? ""
  const selectedStatus: StatusKey | null = isStatusKey(statusParam)
    ? statusParam
    : null

  const boardIdParam = searchParams.get("boardId")
  const selectedBoard =
    boards.find((b) => b.boardId === boardIdParam) ?? null

  const isFiltered = !!(selectedStatus || selectedBoard)

  const postsQuery = useAdminFeedbackInfiniteQuery({
    boardId: selectedBoard?.boardId ?? null,
    status: selectedStatus,
    sort: "newest",
    search: "",
  })

  const posts = useMemo(
    () => postsQuery.data?.pages.flatMap((p) => p.posts) ?? [],
    [postsQuery.data],
  )

  if (!boardsQuery.data) return null

  const totalVotes = posts.reduce((sum, p) => sum + p.voteCount, 0)
  const isInitialLoading = isFiltered && postsQuery.isPending && !postsQuery.data
  const isEmpty =
    isFiltered && !isInitialLoading && posts.length === 0

  function clearFilter(name: "status" | "boardId") {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(name)
    const qs = params.toString()
    const url = `${pathname}${qs ? `?${qs}` : ""}`
    router.replace(url)
  }

  const sidebarBoards = boards.map((b) => ({
    id: b.boardId,
    name: b.boardName,
    slug: b.boardSlug,
    workspaceSlug: b.workspaceSlug,
    postCount: b.postCount,
  }))

  return (
    <AdminPageShell activeItem="feedback">
      <AppTopbar
        title="Feedback"
        subtitle={
          isFiltered ? (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <span className="font-mono tabular-nums">{posts.length}</span>
              <span>posts</span>
              <span aria-hidden>·</span>
              <span className="font-mono tabular-nums">
                {totalVotes.toLocaleString()}
              </span>
              <span>total votes</span>
            </span>
          ) : null
        }
        actions={
          <NewPostFromTopbar
            boards={sidebarBoards}
            activeBoardId={selectedBoard?.boardId ?? null}
          />
        }
      />

      <div className="flex flex-col gap-4 px-4 py-6 sm:px-8">
        {isFiltered ? (
          <FilterChipRow
            status={selectedStatus}
            board={
              selectedBoard
                ? {
                    id: selectedBoard.boardId,
                    name: selectedBoard.boardName,
                  }
                : null
            }
            onClear={clearFilter}
          />
        ) : null}

        {!isFiltered ? (
          <EmptyHint
            icon={Filter}
            title="Pick a status or board"
            description="Use the rail on the left to filter feedback across your boards."
          />
        ) : isInitialLoading ? (
          <PostCardSkeletonList />
        ) : isEmpty ? (
          <EmptyHint
            icon={Inbox}
            title={emptyTitle(selectedStatus, selectedBoard?.boardName ?? null)}
            description="Posts that match this filter will appear here."
          />
        ) : (
          <>
            <FeedbackList posts={posts} />
            <InfiniteScrollSentinel
              hasNextPage={postsQuery.hasNextPage ?? false}
              isFetchingNextPage={postsQuery.isFetchingNextPage}
              onLoadMore={() => postsQuery.fetchNextPage()}
            />
          </>
        )}
      </div>
    </AdminPageShell>
  )
}

function FilterChipRow({
  status,
  board,
  onClear,
}: {
  status: StatusKey | null
  board: { id: string; name: string } | null
  onClear: (name: "status" | "boardId") => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status ? (
        <span className="filter-pill filter-active gap-1.5">
          <StatusIcon status={status} size={12} />
          <span>Status: {STATUS_LABEL[status]}</span>
          <button
            type="button"
            onClick={() => onClear("status")}
            aria-label={`Clear status filter`}
            className="-mr-1 grid size-4 place-items-center rounded-full hover:bg-foreground/10"
          >
            <X className="size-3" aria-hidden />
          </button>
        </span>
      ) : null}
      {board ? (
        <span className="filter-pill filter-active gap-1.5">
          <span
            aria-hidden
            className="block size-2 rounded-full"
            style={{ background: "var(--brand)" }}
          />
          <span>Board: {board.name}</span>
          <button
            type="button"
            onClick={() => onClear("boardId")}
            aria-label={`Clear board filter`}
            className="-mr-1 grid size-4 place-items-center rounded-full hover:bg-foreground/10"
          >
            <X className="size-3" aria-hidden />
          </button>
        </span>
      ) : null}
    </div>
  )
}

function emptyTitle(status: StatusKey | null, boardName: string | null): string {
  if (status && boardName) return `No ${STATUS_LABEL[status].toLowerCase()} posts on ${boardName}`
  if (status) return `No ${STATUS_LABEL[status].toLowerCase()} posts across your boards`
  if (boardName) return `No posts on ${boardName}`
  return "No matching posts"
}
