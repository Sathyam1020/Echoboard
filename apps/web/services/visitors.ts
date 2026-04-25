import { httpClient } from "@/lib/http/axios-client"

export type VisitorIdentity = {
  id: string
  workspaceId: string
  name: string | null
  email: string | null
  avatarUrl: string | null
  authMethod: string
}

export async function fetchVisitorMe(): Promise<{ visitor: VisitorIdentity }> {
  const { data } = await httpClient.get<{ visitor: VisitorIdentity }>(
    "/api/visitors/me",
  )
  return data
}

export async function createGuestVisitor(body: {
  workspaceId: string
  email: string
  name?: string
}): Promise<{ visitorToken: string; visitor: VisitorIdentity }> {
  const { data } = await httpClient.post<{
    visitorToken: string
    visitor: VisitorIdentity
  }>("/api/visitors/guest", body)
  return data
}

export async function identifyVisitor(body: {
  workspaceId: string
  token?: string
  externalId?: string
  email?: string
  name?: string
  avatarUrl?: string
}): Promise<{ visitorToken: string; visitor: VisitorIdentity }> {
  const { data } = await httpClient.post<{
    visitorToken: string
    visitor: VisitorIdentity
  }>("/api/visitors/identify", body)
  return data
}

export async function bridgeVisitorFromSession(body: {
  workspaceId: string
}): Promise<{ visitor: VisitorIdentity | null; isOwner: boolean }> {
  const { data } = await httpClient.post<{
    visitor: VisitorIdentity | null
    isOwner: boolean
  }>("/api/visitors/from-session", body)
  return data
}

export async function signOutVisitor(): Promise<void> {
  await httpClient.post("/api/visitors/sign-out", {})
}
