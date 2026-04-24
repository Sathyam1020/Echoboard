import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PublicFooter } from "@/components/boards/public-footer"
import { PublicTopBar } from "@/components/boards/public-top-bar"
import type { PostDetailResponse } from "@/components/boards/types"
import { CommentList } from "@/components/post/comment-list"
import { PostHeader } from "@/components/post/post-header"
import { StatusPicker } from "@/components/post/status-picker"
import { ApiError, serverApi } from "@/lib/api"

export default async function PostPage({
  params,
}: {
  params: Promise<{
    workspaceSlug: string
    boardSlug: string
    postId: string
  }>
}) {
  const { workspaceSlug, boardSlug, postId } = await params

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

  const backHref = `/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(
    boardSlug,
  )}`

  return (
    <div className="min-h-svh bg-[var(--surface-3)] text-foreground">
      <PublicTopBar
        workspaceName={data.post.workspace.name}
        workspaceSlug={data.post.workspace.slug}
        boardSlug={data.post.board.slug}
        boardId={data.post.board.id}
      />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          All feedback
        </Link>

        {/* Hero — the post itself. */}
        <PostHeader post={data.post} />

        {/* Admin-only status changer. Subtle, sits below hero. */}
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

        {/* Comments section. */}
        <div className="mt-10">
          <CommentList
            postId={data.post.id}
            workspaceOwnerId={data.post.workspace.ownerId}
            initialComments={data.comments}
          />
        </div>
      </div>

      <PublicFooter />
    </div>
  )
}
