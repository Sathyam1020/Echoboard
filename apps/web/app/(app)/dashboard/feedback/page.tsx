import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell/app-shell"
import { AppSidebar } from "@/components/app-shell/app-sidebar"
import { AppTopbar } from "@/components/app-shell/app-topbar"
import type { PostRow } from "@/components/boards/types"
import { FeedbackBoardSwitcher } from "@/components/feedback/feedback-board-switcher"
import { FeedbackList } from "@/components/feedback/feedback-list"
import { NewPostDialog } from "@/components/feedback/new-post-dialog"
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

export default async function FeedbackPage({
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

  const totalVotes = posts.reduce((sum, p) => sum + p.voteCount, 0)

  const publicHref = `/${encodeURIComponent(
    activeBoard.workspaceSlug,
  )}/${encodeURIComponent(activeBoard.boardSlug)}`

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
          activeItem="feedback"
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
    </AppShell>
  )
}
