import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { redirect } from "next/navigation"

import { FeedbackPageContent } from "@/components/feedback/feedback-page-content"
import { getSession } from "@/lib/get-session"
import { queryKeys } from "@/lib/query/keys"
import { makeQueryClient } from "@/lib/query/query-client"
import {
  fetchAdminFeedbackSSR,
  fetchDashboardBoardsSSR,
} from "@/services/dashboard.server"

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ boardId?: string; status?: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/signin")

  const { boardId: boardIdParam, status: statusParam } = await searchParams

  const queryClient = makeQueryClient()

  const boards = await fetchDashboardBoardsSSR()
  if (boards.boards.length === 0) redirect("/onboarding/board")

  queryClient.setQueryData(queryKeys.dashboard.boards(), boards)

  // Only prefetch posts when at least one filter is set. Empty filter
  // state renders the picker hint and never fires the request.
  const boardId = boardIdParam ?? null
  const status = statusParam ?? null
  if (boardId || status) {
    const postsPage = await fetchAdminFeedbackSSR({
      boardId,
      status,
      sort: "newest",
    })
    queryClient.setQueryData(
      queryKeys.dashboard.feedbackList({
        boardId,
        status,
        sort: "newest",
        search: "",
      }),
      { pages: [postsPage], pageParams: [null] },
    )
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FeedbackPageContent />
    </HydrationBoundary>
  )
}
