import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { redirect } from "next/navigation"

import { FeedbackPageContent } from "@/components/feedback/feedback-page-content"
import { getSession } from "@/lib/get-session"
import { queryKeys } from "@/lib/query/keys"
import { makeQueryClient } from "@/lib/query/query-client"
import {
  fetchAdminPostsByBoardSSR,
  fetchDashboardBoardsSSR,
} from "@/services/dashboard.server"

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ boardId?: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/signin")

  const { boardId: boardIdParam } = await searchParams

  const queryClient = makeQueryClient()

  const boards = await fetchDashboardBoardsSSR()
  if (boards.boards.length === 0) redirect("/onboarding/board")

  queryClient.setQueryData(queryKeys.dashboard.boards(), boards)

  const activeBoard =
    boards.boards.find((b) => b.boardId === boardIdParam) ?? boards.boards[0]!
  const posts = await fetchAdminPostsByBoardSSR(activeBoard.boardId)
  queryClient.setQueryData(
    queryKeys.boards.posts(activeBoard.boardId),
    posts,
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FeedbackPageContent />
    </HydrationBoundary>
  )
}
