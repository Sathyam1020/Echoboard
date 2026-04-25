import "server-only"

import { serverHttp } from "@/lib/http/server-axios"

import type { WidgetBoardConfig } from "./widget-config"

export function fetchWidgetConfigSSR(boardId: string): Promise<WidgetBoardConfig> {
  return serverHttp.get<WidgetBoardConfig>(
    `/api/widget/${encodeURIComponent(boardId)}/config`,
  )
}
