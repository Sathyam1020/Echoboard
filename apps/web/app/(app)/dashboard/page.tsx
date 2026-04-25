import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { redirect } from "next/navigation"

import { DashboardContent } from "@/components/app-shell/dashboard-content"
import { getSession } from "@/lib/get-session"
import { queryKeys } from "@/lib/query/keys"
import { makeQueryClient } from "@/lib/query/query-client"
import {
  fetchDashboardBoardsSSR,
  fetchRecentPostsSSR,
} from "@/services/dashboard.server"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/signin")

  const queryClient = makeQueryClient()

  const [boards, recentPosts] = await Promise.all([
    fetchDashboardBoardsSSR(),
    fetchRecentPostsSSR(),
  ])
  queryClient.setQueryData(queryKeys.dashboard.boards(), boards)
  queryClient.setQueryData(queryKeys.dashboard.recentPosts(), recentPosts)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContent />
    </HydrationBoundary>
  )
}
