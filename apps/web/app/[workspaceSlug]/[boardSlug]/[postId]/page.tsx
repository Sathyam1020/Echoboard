import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { notFound } from "next/navigation"

import { PostDetailContent } from "@/components/post/post-detail-content"
import { ApiError } from "@/lib/http/api-error"
import { makeQueryClient } from "@/lib/query/query-client"
import { queryKeys } from "@/lib/query/keys"
import { fetchPostDetailSSR } from "@/services/posts.server"

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

  const queryClient = makeQueryClient()

  try {
    const data = await fetchPostDetailSSR(postId)
    queryClient.setQueryData(queryKeys.posts.detail(postId), data)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostDetailContent
        postId={postId}
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
      />
    </HydrationBoundary>
  )
}
