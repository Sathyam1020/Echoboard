// Compatibility re-export — the previous standalone visitor-client utilities
// now live in `services/visitors.ts`. Existing imports of `signInAsGuest`,
// `signInFromSession`, `signOutVisitor`, `getVisitorMe`, and the
// `VisitorIdentity` type continue to work unchanged.
import { ApiError } from "./http/api-error"
import {
  bridgeVisitorFromSession,
  createGuestVisitor,
  fetchVisitorMe,
  signOutVisitor as signOutVisitorService,
  type VisitorIdentity,
} from "@/services/visitors"

export type { VisitorIdentity }

export async function getVisitorMe(): Promise<VisitorIdentity | null> {
  try {
    const res = await fetchVisitorMe()
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
  const res = await createGuestVisitor(input)
  return res.visitor
}

export async function signInFromSession(
  workspaceId: string,
): Promise<{ visitor: VisitorIdentity | null; isOwner: boolean }> {
  return bridgeVisitorFromSession({ workspaceId })
}

export const signOutVisitor = signOutVisitorService
