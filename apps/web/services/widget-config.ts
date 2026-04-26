import { httpClient } from "@/lib/http/axios-client"

export type WidgetBoardConfig = {
  boardId: string
  boardSlug: string
  boardName: string
  workspaceId: string
  workspaceSlug: string
  workspaceName: string
  requireSignedIdentify: boolean
  color: string | null
  position: "bottom-right" | "bottom-left"
  buttonText: string
  showBranding: boolean
  supportEnabled: boolean
}

export async function fetchWidgetConfig(boardId: string): Promise<WidgetBoardConfig> {
  const { data } = await httpClient.get<WidgetBoardConfig>(
    `/api/widget/${encodeURIComponent(boardId)}/config`,
  )
  return data
}

export async function updateWidgetConfig(
  boardId: string,
  body: Partial<
    Pick<
      WidgetBoardConfig,
      "color" | "position" | "buttonText" | "showBranding" | "supportEnabled"
    >
  >,
): Promise<WidgetBoardConfig> {
  const { data } = await httpClient.patch<WidgetBoardConfig>(
    `/api/boards/${encodeURIComponent(boardId)}/widget-config`,
    body,
  )
  return data
}
