import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { redirect } from "next/navigation"

import { AdminRoadmapContent } from "@/components/roadmap/admin-roadmap-content"
import { getSession } from "@/lib/get-session"
import { queryKeys } from "@/lib/query/keys"
import { makeQueryClient } from "@/lib/query/query-client"
import {
  fetchAdminPostsByBoardSSR,
  fetchDashboardBoardsSSR,
} from "@/services/dashboard.server"

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

  const activeBoard =
    boards.boards.find((b) => b.boardId === boardIdParam) ?? boards.boards[0]!
  // Roadmap auto-fetches subsequent pages on the client until exhausted
  // (see AdminRoadmapContent). Seed page 1 here so first paint renders.
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
      <AdminRoadmapContent />
    </HydrationBoundary>
  )
}
