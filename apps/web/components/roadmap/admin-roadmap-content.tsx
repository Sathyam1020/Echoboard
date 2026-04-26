"use client"

import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { AdminPageShell } from "@/components/app-shell/admin-page-shell"
import { AppTopbar } from "@/components/app-shell/app-topbar"
import { FeedbackBoardSwitcher } from "@/components/feedback/feedback-board-switcher"
import { AdminRoadmap } from "@/components/roadmap/admin-roadmap"
import { useBoardRoadmapQuery } from "@/hooks/queries/use-board-roadmap"
import { useDashboardBoardsQuery } from "@/hooks/use-dashboard"

export function AdminRoadmapContent({
  initialBoardId,
}: {
  // Mirror of FeedbackPageContent — keeps the roadmap anchored on the
  // same board the user picked anywhere else (URL param OR
  // active_board_id cookie OR boards[0]).
  initialBoardId?: string
}) {
  const boardsQuery = useDashboardBoardsQuery()
  const searchParams = useSearchParams()
  const boardIdParam = searchParams.get("boardId") ?? initialBoardId ?? null

  const boards = boardsQuery.data?.boards ?? []
  const activeBoard =
    boards.find((b) => b.boardId === boardIdParam) ?? boards[0]

  // Reuse the non-paginated public roadmap endpoint — same shape we
  // need (all planned/in-progress + recent shipped, capped server-side).
  const roadmap = useBoardRoadmapQuery({
    workspaceSlug: activeBoard?.workspaceSlug ?? "",
    boardSlug: activeBoard?.boardSlug ?? "",
  })

  if (!boardsQuery.data || !activeBoard || !roadmap.data) return null
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
        {/* Key on activeBoard.boardId — AdminRoadmap stores posts in
            local useState seeded from initialPosts. Without remounting
            on board change the state stays stuck on the previous
            board's posts even though the prop changes. Re-keying
            forces a fresh mount so the new initialPosts take effect. */}
        <AdminRoadmap
          key={activeBoard.boardId}
          posts={roadmap.data.posts}
        />
      </div>
    </AdminPageShell>
  )
}
