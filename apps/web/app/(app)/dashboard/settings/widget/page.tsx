import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { WidgetSettingsContent } from "@/components/settings/widget-settings-content"
import { queryKeys } from "@/lib/query/keys"
import { makeQueryClient } from "@/lib/query/query-client"
import { fetchDashboardBoardsSSR } from "@/services/dashboard.server"
import { fetchWidgetConfigSSR } from "@/services/widget-config.server"
import { fetchWorkspaceSettingsSSR } from "@/services/workspaces.server"

export default async function WidgetSettingsPage() {
  const queryClient = makeQueryClient()

  const [boards, settings] = await Promise.all([
    fetchDashboardBoardsSSR(),
    fetchWorkspaceSettingsSSR(),
  ])
  if (boards.boards.length === 0) redirect("/onboarding/board")
  queryClient.setQueryData(queryKeys.dashboard.boards(), boards)
  queryClient.setQueryData(queryKeys.workspaces.settings(), settings)

  // V1: pin to the first board until the customizer grows a board switcher.
  const firstBoard = boards.boards[0]!
  const widgetCfg = await fetchWidgetConfigSSR(firstBoard.boardId)
  queryClient.setQueryData(
    queryKeys.widget.config(firstBoard.boardId),
    widgetCfg,
  )

  // Compute the absolute origin (https://echoboard.io in prod) for the
  // install snippet, from the incoming request's host header.
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? "http"
  const origin = `${proto}://${host}`

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WidgetSettingsContent origin={origin} />
    </HydrationBoundary>
  )
}
