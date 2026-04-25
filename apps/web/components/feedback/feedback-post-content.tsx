"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { AdminPageShell } from "@/components/app-shell/admin-page-shell"
import { PostActionsRow } from "@/components/feedback/post-actions-row"
import { PostStatsCard } from "@/components/feedback/post-stats-card"
import { VoterListCard } from "@/components/feedback/voter-list-card"
import { CommentList } from "@/components/post/comment-list"
import { PostHeader } from "@/components/post/post-header"
import { StatusPicker } from "@/components/post/status-picker"
import { usePostDetailQuery } from "@/hooks/queries/use-post-detail"

export function FeedbackPostContent({ postId }: { postId: string }) {
  const { data } = usePostDetailQuery(postId)
  if (!data) return null

  const voters = data.post.voters ?? []
  const activeComments = data.comments.filter((c) => !c.deletedAt).length

  return (
    <AdminPageShell activeItem="feedback">
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
    </AdminPageShell>
  )
}
