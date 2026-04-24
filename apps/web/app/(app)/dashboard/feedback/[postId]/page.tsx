import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell/app-shell"
import { AppSidebar } from "@/components/app-shell/app-sidebar"
import type { PostDetailResponse } from "@/components/boards/types"
import { PostActionsRow } from "@/components/feedback/post-actions-row"
import { PostStatsCard } from "@/components/feedback/post-stats-card"
import { VoterListCard } from "@/components/feedback/voter-list-card"
import { CommentList } from "@/components/post/comment-list"
import { PostHeader } from "@/components/post/post-header"
import { StatusPicker } from "@/components/post/status-picker"
import { ApiError, serverApi } from "@/lib/api"
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

export default async function FeedbackPostPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/signin")

  const { postId } = await params

  let data: PostDetailResponse
  try {
    data = await serverApi.get<PostDetailResponse>(
      `/api/posts/${encodeURIComponent(postId)}`,
    )
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound()
    }
    throw err
  }

  // If this post was merged into another, the admin should land on the target.
  if (data.post.mergedInto) {
    redirect(`/dashboard/feedback/${data.post.mergedInto.id}`)
  }

  // Non-owners hitting this admin route should bounce back to the list.
  if (!data.post.viewerIsOwner) {
    redirect("/dashboard/feedback")
  }

  const { boards } = await serverApi.get<{ boards: DashboardBoard[] }>(
    "/api/dashboard/boards",
  )

  const voters = data.post.voters ?? []
  const activeComments = data.comments.filter((c) => !c.deletedAt).length

  return (
    <AppShell
      sidebar={
        <AppSidebar
          workspaceName={data.post.workspace.name}
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-4 py-4 sm:px-8 sm:py-5">
        <Link
          href="/dashboard/feedback"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {data.post.board.name}
        </Link>
        <PostActionsRow
          postId={data.post.id}
          boardId={data.post.board.id}
          title={data.post.title}
          description={data.post.description}
          pinned={Boolean(data.post.pinnedAt)}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-6">
          <PostHeader post={data.post} />

          <StatusPicker
            postId={data.post.id}
            initialStatus={data.post.status}
          />

          <hr className="border-border" />

          <CommentList
            postId={data.post.id}
            workspaceOwnerId={data.post.workspace.ownerId}
            initialComments={data.comments}
          />
        </div>

        <aside className="flex flex-col gap-4">
          <VoterListCard voters={voters} totalVotes={data.post.voteCount} />
          <PostStatsCard
            voteCount={data.post.voteCount}
            commentCount={activeComments}
            createdAt={data.post.createdAt}
          />
        </aside>
      </div>
    </AppShell>
  )
}
