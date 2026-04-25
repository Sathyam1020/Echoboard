"use client"

import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { AdminPageShell } from "@/components/app-shell/admin-page-shell"
import { AppTopbar } from "@/components/app-shell/app-topbar"
import { FeedbackBoardSwitcher } from "@/components/feedback/feedback-board-switcher"
import { FeedbackList } from "@/components/feedback/feedback-list"
import { NewPostDialog } from "@/components/feedback/new-post-dialog"
import { useAdminPostsByBoardQuery, useDashboardBoardsQuery } from "@/hooks/use-dashboard"

export function FeedbackPageContent() {
  const boardsQuery = useDashboardBoardsQuery()
  const searchParams = useSearchParams()
  const boardIdParam = searchParams.get("boardId")

  const boards = boardsQuery.data?.boards ?? []
  const activeBoard =
    boards.find((b) => b.boardId === boardIdParam) ?? boards[0]

  // Posts depend on the active board — the hook gates internally on
  // `enabled: !!boardId` so it won't fire until we know it.
  const postsQuery = useAdminPostsByBoardQuery(activeBoard?.boardId ?? "")

  if (!boardsQuery.data || !activeBoard || !postsQuery.data) return null

  const { posts } = postsQuery.data
  const totalVotes = posts.reduce((sum, p) => sum + p.voteCount, 0)
  const publicHref = `/${encodeURIComponent(activeBoard.workspaceSlug)}/${encodeURIComponent(activeBoard.boardSlug)}`

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

      <div className="px-4 py-6 sm:px-8">
        <FeedbackList posts={posts} />
      </div>
    </AdminPageShell>
  )
}
