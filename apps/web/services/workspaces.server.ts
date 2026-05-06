import "server-only"

import { serverHttp } from "@/lib/http/server-axios"

import type {
  WorkspaceMe,
  WorkspaceRoadmapResponse,
  WorkspaceSettingsResponse,
} from "./workspaces"

export function fetchWorkspacesMeSSR(): Promise<WorkspaceMe> {
  return serverHttp.get<WorkspaceMe>("/api/workspaces/me")
}

export function fetchWorkspaceSettingsSSR(): Promise<WorkspaceSettingsResponse> {
  return serverHttp.get<WorkspaceSettingsResponse>(
    "/api/workspaces/me/settings",
  )
}

export function fetchWorkspaceRoadmapSSR(args: {
  workspaceSlug: string
}): Promise<WorkspaceRoadmapResponse> {
  return serverHttp.get<WorkspaceRoadmapResponse>(
    `/api/workspaces/by-slug/${encodeURIComponent(args.workspaceSlug)}/roadmap`,
  )
}

export function fetchPublicWorkspaceRoadmapSSR(args: {
  workspaceSlug: string
}): Promise<WorkspaceRoadmapResponse> {
  return serverHttp.get<WorkspaceRoadmapResponse>(
    `/api/workspaces/by-slug/${encodeURIComponent(args.workspaceSlug)}/roadmap/public`,
  )
}
