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
    <div className="min-h-svh bg-background text-foreground">
      <PublicTopBar
        workspaceName={data.post.workspace.name}
        boardId={data.post.board.id}
      />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All feedback
        </Link>

        <PostHeader post={data.post} />

        {data.post.viewerIsOwner ? (
          <div className="mt-6">
            <StatusPicker
              postId={data.post.id}
              initialStatus={data.post.status}
            />
          </div>
        ) : null}

        <hr className="my-8 border-border" />

        <CommentList
          postId={data.post.id}
          workspaceOwnerId={data.post.workspace.ownerId}
          initialComments={data.comments}
        />
      </div>

      <PublicFooter />
    </div>
  )
}
