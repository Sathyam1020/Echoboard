"use client"

import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { AdminPageShell } from "@/components/app-shell/admin-page-shell"
import { AppTopbar } from "@/components/app-shell/app-topbar"
import { FeedbackBoardSwitcher } from "@/components/feedback/feedback-board-switcher"
import { AdminRoadmap } from "@/components/roadmap/admin-roadmap"
import {
  useAdminPostsByBoardQuery,
  useDashboardBoardsQuery,
} from "@/hooks/use-dashboard"

export function AdminRoadmapContent() {
  const boardsQuery = useDashboardBoardsQuery()
  const searchParams = useSearchParams()
  const boardIdParam = searchParams.get("boardId")

  const boards = boardsQuery.data?.boards ?? []
  const activeBoard =
    boards.find((b) => b.boardId === boardIdParam) ?? boards[0]
  const postsQuery = useAdminPostsByBoardQuery(activeBoard?.boardId ?? "")

  if (!boardsQuery.data || !activeBoard || !postsQuery.data) return null

  const { posts } = postsQuery.data
  const publicHref = `/${encodeURIComponent(activeBoard.workspaceSlug)}/${encodeURIComponent(activeBoard.boardSlug)}/roadmap`

  return (
    <AdminPageShell activeItem="roadmap">
      <AppTopbar
        title={
          boards.length > 1 ? (
            <div className="flex items-center gap-2">
              <span>Roadmap</span>
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
            "Roadmap"
          )
        }
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <span>Drag cards between columns to change status.</span>
            <span aria-hidden>·</span>
            <Link
              href={publicHref}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              View public roadmap
              <ExternalLink className="size-3" aria-hidden />
            </Link>
          </span>
        }
      />

      <div className="px-4 py-6 sm:px-8">
        <AdminRoadmap posts={posts} />
      </div>
    </AdminPageShell>
  )
}
