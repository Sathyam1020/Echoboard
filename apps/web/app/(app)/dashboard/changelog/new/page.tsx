import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { redirect } from "next/navigation"

import { NewChangelogContent } from "@/components/changelog/new-changelog-content"
import { getSession } from "@/lib/get-session"
import { queryKeys } from "@/lib/query/keys"
import { makeQueryClient } from "@/lib/query/query-client"
import { fetchDashboardBoardsSSR } from "@/services/dashboard.server"

export default async function NewChangelogPage() {
  const session = await getSession()
  if (!session) redirect("/signin")

  const queryClient = makeQueryClient()
  const boards = await fetchDashboardBoardsSSR()
  if (boards.boards.length === 0) redirect("/onboarding/board")
  queryClient.setQueryData(queryKeys.dashboard.boards(), boards)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NewChangelogContent />
    </HydrationBoundary>
  )
}
