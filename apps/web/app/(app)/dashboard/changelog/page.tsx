import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { redirect } from "next/navigation"

import { ChangelogPageContent } from "@/components/changelog/changelog-page-content"
import { getSession } from "@/lib/get-session"
import { queryKeys } from "@/lib/query/keys"
import { makeQueryClient } from "@/lib/query/query-client"
import { fetchChangelogListSSR } from "@/services/changelog-admin.server"
import { fetchDashboardBoardsSSR } from "@/services/dashboard.server"

export default async function ChangelogAdminPage() {
  const session = await getSession()
  if (!session) redirect("/signin")

  const queryClient = makeQueryClient()

  const [boards, list] = await Promise.all([
    fetchDashboardBoardsSSR(),
    fetchChangelogListSSR(),
  ])
  if (boards.boards.length === 0) redirect("/onboarding/board")

  queryClient.setQueryData(queryKeys.dashboard.boards(), boards)
  queryClient.setQueryData(queryKeys.changelog.list(), list)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ChangelogPageContent />
    </HydrationBoundary>
  )
}
