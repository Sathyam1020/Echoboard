import { ApiError, api } from "./api"

export type VisitorIdentity = {
  id: string
  workspaceId: string
  name: string | null
  email: string | null
  avatarUrl: string | null
  authMethod: string
}

type VisitorResponse = { visitor: VisitorIdentity; visitorToken: string }

export async function getVisitorMe(): Promise<VisitorIdentity | null> {
  try {
    const res = await api.get<{ visitor: VisitorIdentity }>("/api/visitors/me")
    return res.visitor
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    throw err
  }
}

export async function signInAsGuest(input: {
  workspaceId: string
  email: string
  name?: string
}): Promise<VisitorIdentity> {
  const res = await api.post<VisitorResponse>("/api/visitors/guest", input)
  return res.visitor
}

export async function signInFromSession(
  workspaceId: string,
): Promise<{ visitor: VisitorIdentity | null; isOwner: boolean }> {
  const res = await api.post<{
    visitor: VisitorIdentity | null
    isOwner: boolean
  }>("/api/visitors/from-session", { workspaceId })
  return { visitor: res.visitor, isOwner: res.isOwner }
}

export async function signOutVisitor(): Promise<void> {
  await api.post("/api/visitors/sign-out", {})
}
