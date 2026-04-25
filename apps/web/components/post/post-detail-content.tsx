"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { PublicFooter } from "@/components/boards/public-footer"
import { PublicSidebar } from "@/components/boards/public-sidebar"
import { PublicTopBar } from "@/components/boards/public-top-bar"
import { PageEnter } from "@/components/common/page-enter"
import { CommentList } from "@/components/post/comment-list"
import { PostDetailSidebar } from "@/components/post/post-detail-sidebar"
import { PostHeader } from "@/components/post/post-header"
import { StatusPicker } from "@/components/post/status-picker"
import { usePostDetailQuery } from "@/hooks/queries/use-post-detail"

export function PostDetailContent({
  postId,
  workspaceSlug,
  boardSlug,
}: {
  postId: string
  workspaceSlug: string
  boardSlug: string
}) {
  const { data } = usePostDetailQuery(postId)
  if (!data) return null

  const backHref = `/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(boardSlug)}`

  return (
    <div className="min-h-svh bg-[var(--surface-3)] text-foreground">
      <PublicTopBar
        workspaceName={data.post.workspace.name}
        workspaceSlug={data.post.workspace.slug}
        workspaceId={data.post.workspace.id}
        workspaceOwnerId={data.post.workspace.ownerId}
        boardSlug={data.post.board.slug}
        boardId={data.post.board.id}
      />

      <PageEnter className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          All feedback
        </Link>

        <div className="flex flex-col-reverse gap-8 lg:flex-row">
          <PublicSidebar className="lg:w-60 lg:flex-shrink-0">
            <PostDetailSidebar post={data.post} />
          </PublicSidebar>

          <main className="min-w-0 flex-1">
            <PostHeader post={data.post} />

            {data.post.viewerIsOwner ? (
              <div className="mt-5 flex flex-col gap-2.5 rounded-xl border border-dashed border-border bg-card/40 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Admin · change status
                  </span>
                </div>
                <StatusPicker
                  postId={data.post.id}
                  initialStatus={data.post.status}
                />
              </div>
            ) : null}

            <div className="mt-10">
              <CommentList
                postId={data.post.id}
                workspaceId={data.post.workspace.id}
                workspaceOwnerId={data.post.workspace.ownerId}
              />
            </div>
          </main>
        </div>
      </PageEnter>

      <PublicFooter />
    </div>
  )
}
