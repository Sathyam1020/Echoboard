"use client"

import { useCallback, useState } from "react"

import {
  getVisitorMe,
  signInFromSession,
  type VisitorIdentity,
} from "@/lib/visitor-client"
import { authClient } from "@/lib/auth-client"

export type EnsureResult =
  | { kind: "admin" } // workspace owner — they post via existing admin path
  | { kind: "visitor"; visitor: VisitorIdentity }
  | { kind: "modal" } // need email/name from the user

// Resolve the actor for a public-board action. Order:
//   1. Has a visitor cookie? → /me confirms, return visitor.
//   2. Signed-in echoboard user? → from-session bridges; admin if owner.
//   3. Otherwise → caller should open the identity modal.
export function useVisitorIdentity(input: {
  workspaceId: string
  workspaceOwnerId: string
}) {
  const { data: session } = authClient.useSession()
  const [visitor, setVisitor] = useState<VisitorIdentity | null>(null)

  const ensure = useCallback(async (): Promise<EnsureResult> => {
    // Cached visitor from a prior call this session
    if (visitor) return { kind: "visitor", visitor }

    // Existing visitor cookie → /me validates it
    const me = await getVisitorMe()
    if (me) {
      setVisitor(me)
      return { kind: "visitor", visitor: me }
    }

    // Logged into echoboard? Use that identity to bootstrap.
    if (session?.user?.id) {
      if (session.user.id === input.workspaceOwnerId) {
        return { kind: "admin" }
      }
      const res = await signInFromSession(input.workspaceId)
      if (res.isOwner) return { kind: "admin" }
      if (res.visitor) {
        setVisitor(res.visitor)
        return { kind: "visitor", visitor: res.visitor }
      }
    }

    return { kind: "modal" }
  }, [input.workspaceId, input.workspaceOwnerId, session?.user?.id, visitor])

  // Called by the modal after a guest signup completes — caches the new id
  // so subsequent ensure() calls skip the round-trip.
  const setIdentity = useCallback((v: VisitorIdentity) => {
    setVisitor(v)
  }, [])

  return { ensure, setIdentity, visitor }
}
