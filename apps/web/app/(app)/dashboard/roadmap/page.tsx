import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell/app-shell"
import { AppSidebar } from "@/components/app-shell/app-sidebar"
import { AppTopbar } from "@/components/app-shell/app-topbar"
import type { PostRow } from "@/components/boards/types"
import { FeedbackBoardSwitcher } from "@/components/feedback/feedback-board-switcher"
import { AdminRoadmap } from "@/components/roadmap/admin-roadmap"
import { serverApi } from "@/lib/api"
import { getSession } from "@/lib/get-session"

type DashboardBoard = {
  boardId: string
  boardName: string
  boardSlug: string
  boardVisibility: string
  workspaceSlug: string
  workspaceName: string
  postCount: number
  createdAt: string
}

export default async function RoadmapPage({
  searchParams,
}: {
  searchParams: Promise<{ boardId?: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/signin")

  const { boardId: boardIdParam } = await searchParams

  const { boards } = await serverApi.get<{ boards: DashboardBoard[] }>(
    "/api/dashboard/boards",
  )
  if (boards.length === 0) redirect("/onboarding/board")

  const activeBoard =
    boards.find((b) => b.boardId === boardIdParam) ?? boards[0]!
  const workspaceName = activeBoard.workspaceName

  const { posts } = await serverApi.get<{ posts: PostRow[] }>(
    `/api/boards/${encodeURIComponent(activeBoard.boardId)}/posts`,
  )

  const publicHref = `/${encodeURIComponent(
    activeBoard.workspaceSlug,
  )}/${encodeURIComponent(activeBoard.boardSlug)}/roadmap`

  return (
    <AppShell
      sidebar={
        <AppSidebar
          workspaceName={workspaceName}
          boards={boards.map((b) => ({
            id: b.boardId,
            name: b.boardName,
            slug: b.boardSlug,
            workspaceSlug: b.workspaceSlug,
            postCount: b.postCount,
          }))}
          activeItem="roadmap"
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
        />
      }
    >
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
    </AppShell>
  )
}
