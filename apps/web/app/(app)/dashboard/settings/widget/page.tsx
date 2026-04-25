import { headers } from "next/headers"

import { WidgetTabClient } from "@/components/settings/widget-tab-client"
import { serverApi } from "@/lib/api"

type SettingsResponse = {
  settings: {
    id: string
    name: string
    slug: string
    publicBoardAuth: string
    requireSignedIdentify: boolean
    identifySecretKey: string | null
    ssoRedirectUrl: string | null
  }
}

type WidgetConfigResponse = {
  boardId: string
  color: string | null
  position: "bottom-right" | "bottom-left"
  buttonText: string
  showBranding: boolean
}

type DashboardBoard = {
  boardId: string
  boardName: string
  boardSlug: string
  workspaceSlug: string
  workspaceName: string
}

export default async function WidgetSettingsPage() {
  const [{ boards }, { settings }] = await Promise.all([
    serverApi.get<{ boards: DashboardBoard[] }>("/api/dashboard/boards"),
    serverApi.get<SettingsResponse>("/api/workspaces/me/settings"),
  ])

  // V1 wires the widget to the first board. Multi-board support comes when
  // the customizer grows a board switcher (queued for v2).
  const firstBoard = boards[0]!
  const widgetCfg = await serverApi.get<WidgetConfigResponse>(
    `/api/widget/${encodeURIComponent(firstBoard.boardId)}/config`,
  )

  // Compute the absolute origin (https://echoboard.io in prod) for the
  // install snippet, from the incoming request's host header.
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? "http"
  const origin = `${proto}://${host}`

  return (
    <WidgetTabClient
      boardId={firstBoard.boardId}
      origin={origin}
      initialConfig={{
        color: widgetCfg.color,
        position: widgetCfg.position,
        buttonText: widgetCfg.buttonText,
        showBranding: widgetCfg.showBranding,
      }}
      initialIdentifySecret={settings.identifySecretKey}
      initialRequireSigned={settings.requireSignedIdentify}
    />
  )
}
