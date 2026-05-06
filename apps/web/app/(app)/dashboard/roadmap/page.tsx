import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { redirect } from "next/navigation"

import { AdminRoadmapContent } from "@/components/roadmap/admin-roadmap-content"
import { getSession } from "@/lib/get-session"
import { queryKeys } from "@/lib/query/keys"
import { makeQueryClient } from "@/lib/query/query-client"
import { fetchDashboardBoardsSSR } from "@/services/dashboard.server"
import { fetchWorkspaceRoadmapSSR } from "@/services/workspaces.server"

export default async function RoadmapPage() {
  const session = await getSession()
  if (!session) redirect("/signin")

  const queryClient = makeQueryClient()

  const boards = await fetchDashboardBoardsSSR()
  if (boards.boards.length === 0) redirect("/onboarding/board")
  queryClient.setQueryData(queryKeys.dashboard.boards(), boards)

  // Roadmap is workspace-scoped — the URL `?boardId=` and
  // `active_board_id` cookie are no longer consulted here.
  const workspaceSlug = boards.boards[0]!.workspaceSlug

  const roadmap = await fetchWorkspaceRoadmapSSR({ workspaceSlug })
  queryClient.setQueryData(
    queryKeys.workspaces.roadmap(workspaceSlug),
    roadmap,
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminRoadmapContent />
    </HydrationBoundary>
  )
}
