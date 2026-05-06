import { httpClient } from "@/lib/http/axios-client"

import type { PostRowWithBoard } from "./boards"

export type WorkspaceRole = "owner" | "admin" | "member"

export type WorkspaceRoadmapResponse = {
  workspace: { id: string; name: string; slug: string; ownerId: string }
  /** Earliest-created public board in the workspace. Used by the
   *  topbar's Submit dialog as the implicit target when the visitor
   *  is on a workspace-level surface (no specific board context). */
  firstBoard: { id: string; name: string; slug: string } | null
  /** All planned + in-progress posts plus the 50 most recent shipped,
   *  aggregated across every board in the workspace. Each post carries
   *  its source `board` so the UI can render a board chip on the card. */
  posts: PostRowWithBoard[]
}

export async function fetchWorkspaceRoadmap(args: {
  workspaceSlug: string
}): Promise<WorkspaceRoadmapResponse> {
  const { data } = await httpClient.get<WorkspaceRoadmapResponse>(
    `/api/workspaces/by-slug/${encodeURIComponent(args.workspaceSlug)}/roadmap`,
  )
  return data
}

// Public sibling of fetchWorkspaceRoadmap. No auth required; the
// backend filters to public-board posts only.
export async function fetchPublicWorkspaceRoadmap(args: {
  workspaceSlug: string
}): Promise<WorkspaceRoadmapResponse> {
  const { data } = await httpClient.get<WorkspaceRoadmapResponse>(
    `/api/workspaces/by-slug/${encodeURIComponent(args.workspaceSlug)}/roadmap/public`,
  )
  return data
}

export type WorkspaceMeRow = {
  id: string
  name: string
  slug: string
  ownerId: string
  role: WorkspaceRole
  // True for the workspace selected by the active_workspace_id cookie.
  // The backend guarantees the active workspace is sorted to index 0.
  active: boolean
}

export type WorkspaceMe = {
  workspaces: WorkspaceMeRow[]
}

export type WorkspaceSettings = {
  id: string
  name: string
  slug: string
  publicBoardAuth: string
  requireSignedIdentify: boolean
  identifySecretKey: string | null
  ssoRedirectUrl: string | null
}

export type WorkspaceSettingsResponse = { settings: WorkspaceSettings }

export async function fetchWorkspacesMe(): Promise<WorkspaceMe> {
  const { data } = await httpClient.get<WorkspaceMe>("/api/workspaces/me")
  return data
}

export async function fetchWorkspaceSettings(): Promise<WorkspaceSettingsResponse> {
  const { data } = await httpClient.get<WorkspaceSettingsResponse>(
    "/api/workspaces/me/settings",
  )
  return data
}

export async function updateWorkspaceSettings(
  patch: Partial<{
    publicBoardAuth: string
    requireSignedIdentify: boolean
    ssoRedirectUrl: string | null
  }>,
): Promise<WorkspaceSettingsResponse> {
  const { data } = await httpClient.patch<WorkspaceSettingsResponse>(
    "/api/workspaces/me/settings",
    patch,
  )
  return data
}

export async function regenerateIdentifyKey(): Promise<WorkspaceSettingsResponse> {
  const { data } = await httpClient.post<WorkspaceSettingsResponse>(
    "/api/workspaces/me/settings/regenerate-identify-key",
    {},
  )
  return data
}

export async function createWorkspace(body: { name: string; slug: string }): Promise<{
  workspace: { id: string; name: string; slug: string; ownerId: string }
}> {
  const { data } = await httpClient.post<{
    workspace: { id: string; name: string; slug: string; ownerId: string }
  }>("/api/workspaces", body)
  return data
}

export async function activateWorkspace(workspaceId: string): Promise<{
  workspace: { id: string; slug: string; name: string; role: WorkspaceRole }
}> {
  const { data } = await httpClient.post<{
    workspace: { id: string; slug: string; name: string; role: WorkspaceRole }
  }>(`/api/workspaces/${workspaceId}/activate`, {})
  return data
}
