import { dehydrate, HydrationBoundary } from "@tanstack/react-query"

import { GeneralSettingsContent } from "@/components/settings/general-settings-content"
import { queryKeys } from "@/lib/query/keys"
import { makeQueryClient } from "@/lib/query/query-client"
import { fetchWorkspacesMeSSR } from "@/services/workspaces.server"

export default async function GeneralSettingsPage() {
  const queryClient = makeQueryClient()
  const workspaces = await fetchWorkspacesMeSSR()
  queryClient.setQueryData(queryKeys.workspaces.me(), workspaces)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GeneralSettingsContent />
    </HydrationBoundary>
  )
}
