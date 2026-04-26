import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { cookies } from "next/headers"
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

  // Active board resolution: URL param wins (explicit), then the
  // active_board_id cookie (last switcher pick), then the first board.
  // The .find() falls through to boards[0] if either id no longer
  // belongs to the active workspace.
  const cookieStore = await cookies()
  const cookieBoardId = cookieStore.get("active_board_id")?.value ?? null
  const activeBoard =
    boards.boards.find((b) => b.boardId === boardIdParam) ??
    boards.boards.find((b) => b.boardId === cookieBoardId) ??
    boards.boards[0]!
  const postsPage = await fetchAdminPostsByBoardSSR({
    boardId: activeBoard.boardId,
    sort: "newest",
  })
  queryClient.setQueryData(
    queryKeys.boards.posts(activeBoard.boardId, "newest", ""),
    { pages: [postsPage], pageParams: [null] },
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FeedbackPageContent initialBoardId={activeBoard.boardId} />
    </HydrationBoundary>
  )
}
