import { httpClient } from "@/lib/http/axios-client"

export type WorkspaceMe = {
  workspaces: { id: string; name: string; slug: string; ownerId: string }[]
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
