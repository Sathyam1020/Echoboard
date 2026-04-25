import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { redirect } from "next/navigation"
import { type ReactNode } from "react"

import { SettingsShellContent } from "@/components/settings/settings-shell-content"
import { getSession } from "@/lib/get-session"
import { queryKeys } from "@/lib/query/keys"
import { makeQueryClient } from "@/lib/query/query-client"
import { fetchDashboardBoardsSSR } from "@/services/dashboard.server"

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/signin")

  const queryClient = makeQueryClient()
  const boards = await fetchDashboardBoardsSSR()
  if (boards.boards.length === 0) redirect("/onboarding/board")
  queryClient.setQueryData(queryKeys.dashboard.boards(), boards)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SettingsShellContent>{children}</SettingsShellContent>
    </HydrationBoundary>
  )
}
