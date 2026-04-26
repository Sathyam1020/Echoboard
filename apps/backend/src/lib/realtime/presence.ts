// In-process presence tracking for the support workspace channel.
//
// We deliberately don't lean on Redis here for the first cut — single
// replica covers the dev + early-prod case. The set is workspace-scoped
// because the public API (widget header indicator) only ever asks "is
// anyone from <workspace> online right now?" — it doesn't need to know
// which user.
//
// When we move to multi-replica, swap this for `SADD support:presence:
// <wid> <userId>` against Upstash Redis with a 60s TTL refreshed by
// the WS heartbeat. The public surface (listOnline / addPresence /
// removePresence) stays identical.

import { db, eq } from "@workspace/db/client"
import { workspaceMember } from "@workspace/db/schema"

// workspaceId → Set<userId>
const onlineByWorkspace = new Map<string, Set<string>>()

type PresenceListener = (event: {
  workspaceId: string
  userId: string
  status: "online" | "offline"
}) => void

const listeners = new Set<PresenceListener>()

export function onPresenceChange(fn: PresenceListener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function emit(event: Parameters<PresenceListener>[0]): void {
  for (const fn of listeners) fn(event)
}

// Adds the user across every workspace they're a member of. The widget
// asks "is the team online?" — meaning ANY admin of the workspace —
// so we need to track per-workspace membership rather than per-user.
export async function addPresence(userId: string): Promise<void> {
  const memberships = await db
    .select({ workspaceId: workspaceMember.workspaceId })
    .from(workspaceMember)
    .where(eq(workspaceMember.userId, userId))
  for (const m of memberships) {
    let set = onlineByWorkspace.get(m.workspaceId)
    if (!set) {
      set = new Set()
      onlineByWorkspace.set(m.workspaceId, set)
    }
    if (!set.has(userId)) {
      set.add(userId)
      emit({
        workspaceId: m.workspaceId,
        userId,
        status: "online",
      })
    }
  }
}

export async function removePresence(userId: string): Promise<void> {
  for (const [workspaceId, set] of onlineByWorkspace) {
    if (!set.delete(userId)) continue
    emit({ workspaceId, userId, status: "offline" })
    if (set.size === 0) onlineByWorkspace.delete(workspaceId)
  }
}

export function listOnline(workspaceId: string): string[] {
  const set = onlineByWorkspace.get(workspaceId)
  return set ? Array.from(set) : []
}

export function isAnyoneOnline(workspaceId: string): boolean {
  const set = onlineByWorkspace.get(workspaceId)
  return set != null && set.size > 0
}
