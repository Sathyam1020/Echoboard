"use client"

import { useCallback } from "react"

import { useVisitorStore } from "@/stores/store-provider"
import { authClient } from "@/lib/auth-client"
import {
  getVisitorMe,
  signInFromSession,
  type VisitorIdentity,
} from "@/lib/visitor-client"

export type EnsureResult =
  | { kind: "admin" } // workspace owner — they post via existing admin path
  | { kind: "visitor"; visitor: VisitorIdentity }
  | { kind: "modal" } // need email/name from the user

// Resolve the actor for a public-board action. Order:
//   1. Has a cached visitor in the store? → use it.
//   2. /api/visitors/me cookie still valid? → cache + use.
//   3. Signed-in echoboard user? → from-session bridges; admin if owner.
//   4. Otherwise → caller should open the identity modal.
//
// The cache lives in the global visitor store so a successful identification
// from one component (vote button, comment composer, submit dialog, …) is
// immediately visible to the others.
export function useVisitorIdentity(input: {
  workspaceId: string
  workspaceOwnerId: string
}) {
  const { data: session } = authClient.useSession()
  const visitor = useVisitorStore((s) => s.visitor)
  const setVisitor = useVisitorStore((s) => s.setVisitor)

  const ensure = useCallback(async (): Promise<EnsureResult> => {
    if (visitor) return { kind: "visitor", visitor }

    const me = await getVisitorMe()
    if (me) {
      setVisitor(me)
      return { kind: "visitor", visitor: me }
    }

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
  }, [
    input.workspaceId,
    input.workspaceOwnerId,
    session?.user?.id,
    visitor,
    setVisitor,
  ])

  // Called by the modal after a guest signup completes — caches the new id
  // so subsequent ensure() calls skip the round-trip, and so other live
  // components on the page reflect it immediately.
  const setIdentity = useCallback(
    (v: VisitorIdentity) => setVisitor(v),
    [setVisitor],
  )

  return { ensure, setIdentity, visitor }
}
