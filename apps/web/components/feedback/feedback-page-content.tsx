"use client"

import { ExternalLink, Inbox } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

import { AdminPageShell } from "@/components/app-shell/admin-page-shell"
import { AppTopbar } from "@/components/app-shell/app-topbar"
import { EmptyHint } from "@/components/common/empty-hint"
import { InfiniteScrollSentinel } from "@/components/common/infinite-scroll-sentinel"
import { FeedbackBoardSwitcher } from "@/components/feedback/feedback-board-switcher"
import { FeedbackList } from "@/components/feedback/feedback-list"
import { NewPostDialog } from "@/components/feedback/new-post-dialog"
import { PostCardSkeletonList } from "@/components/skeletons/post-card-skeleton"
import {
  useAdminPostsByBoardInfiniteQuery,
  useDashboardBoardsQuery,
} from "@/hooks/use-dashboard"

export function FeedbackPageContent() {
  const boardsQuery = useDashboardBoardsQuery()
  const searchParams = useSearchParams()
  const boardIdParam = searchParams.get("boardId")

  const boards = boardsQuery.data?.boards ?? []
  const activeBoard =
    boards.find((b) => b.boardId === boardIdParam) ?? boards[0]

  const postsQuery = useAdminPostsByBoardInfiniteQuery({
    boardId: activeBoard?.boardId ?? "",
    sort: "newest",
    search: "",
  })

  const posts = useMemo(
    () => postsQuery.data?.pages.flatMap((p) => p.posts) ?? [],
    [postsQuery.data],
  )

  if (!boardsQuery.data || !activeBoard) return null

  const totalVotes = posts.reduce((sum, p) => sum + p.voteCount, 0)
  const publicHref = `/${encodeURIComponent(activeBoard.workspaceSlug)}/${encodeURIComponent(activeBoard.boardSlug)}`
  const isInitialLoading = postsQuery.isPending && !postsQuery.data
  const isEmpty = !isInitialLoading && posts.length === 0

  return (
    <AdminPageShell activeItem="feedback">
      <AppTopbar
        title={
          boards.length > 1 ? (
            <div className="flex items-center gap-2">
              <span>Feedback</span>
              <span className="text-muted-foreground">·</span>
              <FeedbackBoardSwitcher
                boards={boards.map((b) => ({
                  id: b.boardId,
                  name: b.boardName,
                  slug: b.boardSlug,
                  postCount: b.postCount,
                }))}
                activeBoardId={activeBoard.boardId}
              />
            </div>
          ) : (
            activeBoard.boardName
          )
        }
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <span className="font-mono tabular-nums">{posts.length}</span>
            <span>posts</span>
            <span aria-hidden>·</span>
            <span className="font-mono tabular-nums">
              {totalVotes.toLocaleString()}
            </span>
            <span>total votes</span>
            <span aria-hidden>·</span>
            <Link
              href={publicHref}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              View public board
              <ExternalLink className="size-3" aria-hidden />
            </Link>
          </span>
        }
        actions={<NewPostDialog boardId={activeBoard.boardId} />}
      />

      <div className="flex flex-col gap-4 px-4 py-6 sm:px-8">
        {isInitialLoading ? (
          <PostCardSkeletonList />
        ) : isEmpty ? (
          <EmptyHint
            icon={Inbox}
            title={`No feedback in ${activeBoard.boardName}`}
            description="Once users submit ideas to this board, they'll appear here."
            action={<NewPostDialog boardId={activeBoard.boardId} />}
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
