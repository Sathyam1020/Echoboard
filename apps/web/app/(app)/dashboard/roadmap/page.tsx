import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AdminRoadmapContent } from "@/components/roadmap/admin-roadmap-content"
import { getSession } from "@/lib/get-session"
import { queryKeys } from "@/lib/query/keys"
import { makeQueryClient } from "@/lib/query/query-client"
import { fetchBoardRoadmapSSR } from "@/services/boards.server"
import { fetchDashboardBoardsSSR } from "@/services/dashboard.server"

export default async function RoadmapPage({
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

  // URL param > active_board_id cookie > boards[0]. Same precedence as
  // the feedback page so both surfaces stay anchored to whichever board
  // the user last picked in either switcher.
  const cookieStore = await cookies()
  const cookieBoardId = cookieStore.get("active_board_id")?.value ?? null
  const activeBoard =
    boards.boards.find((b) => b.boardId === boardIdParam) ??
    boards.boards.find((b) => b.boardId === cookieBoardId) ??
    boards.boards[0]!

  const roadmap = await fetchBoardRoadmapSSR({
    workspaceSlug: activeBoard.workspaceSlug,
    boardSlug: activeBoard.boardSlug,
  })
  queryClient.setQueryData(
    queryKeys.boards.roadmap(
      activeBoard.workspaceSlug,
      activeBoard.boardSlug,
    ),
    roadmap,
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminRoadmapContent initialBoardId={activeBoard.boardId} />
    </HydrationBoundary>
  )
}
