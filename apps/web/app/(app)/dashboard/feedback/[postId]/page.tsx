import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { notFound, redirect } from "next/navigation"

import { FeedbackPostContent } from "@/components/feedback/feedback-post-content"
import { getSession } from "@/lib/get-session"
import { ApiError } from "@/lib/http/api-error"
import { queryKeys } from "@/lib/query/keys"
import { makeQueryClient } from "@/lib/query/query-client"
import { fetchDashboardBoardsSSR } from "@/services/dashboard.server"
import {
  fetchPostCommentsSSR,
  fetchPostDetailSSR,
} from "@/services/posts.server"

export default async function FeedbackPostPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/signin")

  const { postId } = await params

  const queryClient = makeQueryClient()

  let detail: Awaited<ReturnType<typeof fetchPostDetailSSR>>
  try {
    detail = await fetchPostDetailSSR(postId)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  // If this post was merged into another, the admin should land on the target.
  if (detail.post.mergedInto) {
    redirect(`/dashboard/feedback/${detail.post.mergedInto.id}`)
  }
  // Non-owners hitting this admin route should bounce back to the list.
  if (!detail.post.viewerIsOwner) redirect("/dashboard/feedback")

  queryClient.setQueryData(queryKeys.posts.detail(postId), detail)

  // Seed comments + boards in parallel — both are independent of the
  // post detail above.
  const [boards, commentsPage] = await Promise.all([
    fetchDashboardBoardsSSR(),
    fetchPostCommentsSSR({ postId }),
  ])
  queryClient.setQueryData(queryKeys.dashboard.boards(), boards)
  queryClient.setQueryData(queryKeys.comments.byPost(postId), {
    pages: [commentsPage],
    pageParams: [null],
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FeedbackPostContent postId={postId} />
    </HydrationBoundary>
  )
}
