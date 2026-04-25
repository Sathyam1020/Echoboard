import "server-only"

import { serverHttp } from "@/lib/http/server-axios"

import type { WorkspaceMe, WorkspaceSettingsResponse } from "./workspaces"

export function fetchWorkspacesMeSSR(): Promise<WorkspaceMe> {
  return serverHttp.get<WorkspaceMe>("/api/workspaces/me")
}

export function fetchWorkspaceSettingsSSR(): Promise<WorkspaceSettingsResponse> {
  return serverHttp.get<WorkspaceSettingsResponse>(
    "/api/workspaces/me/settings",
  )
}
