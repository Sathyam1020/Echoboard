import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { redirect } from "next/navigation"

import { OnboardingBoardContent } from "@/components/onboarding/onboarding-board-content"
import { getSession } from "@/lib/get-session"
import { queryKeys } from "@/lib/query/keys"
import { makeQueryClient } from "@/lib/query/query-client"
import { fetchWorkspacesMeSSR } from "@/services/workspaces.server"

export default async function OnboardingBoardPage() {
  const session = await getSession()
  if (!session) redirect("/signin?redirectTo=/onboarding/board")

  const queryClient = makeQueryClient()
  const workspaces = await fetchWorkspacesMeSSR()
  if (workspaces.workspaces.length === 0) redirect("/onboarding/workspace")
  queryClient.setQueryData(queryKeys.workspaces.me(), workspaces)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OnboardingBoardContent />
    </HydrationBoundary>
  )
}
