"use client"

import { useEffect, useState } from "react"

import { widgetHttp } from "@/lib/http/widget-axios"
import {
  subscribe,
  type ServerMsg,
} from "@/lib/realtime/socket-client"

// "Is at least one admin from this workspace online?"
//
// Seeds from /api/support/presence on mount, then patches its boolean
// state from the workspace channel's presence events. Tracks online
// user ids in a Set so a second admin going offline doesn't flip the
// indicator to "offline" while a first admin is still connected.
export function useTeamPresence({
  workspaceSlug,
  workspaceId,
}: {
  workspaceSlug: string
  workspaceId: string
}): boolean {
  const [online, setOnline] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!workspaceSlug) return
    widgetHttp
      .get<{ online: boolean }>("/api/support/presence", {
        params: { workspaceSlug },
      })
      .then((r) => {
        if (!cancelled) setOnline(r.data.online)
      })
      .catch(() => {
        if (!cancelled) setOnline(false)
      })
    return () => {
      cancelled = true
    }
  }, [workspaceSlug])

  // Live updates via the workspace channel. We track which userIds we've
  // heard "online" for so a single admin disconnecting doesn't flip the
  // boolean to false if other admins are still connected.
  useEffect(() => {
    if (!workspaceId) return
    const onlineSet = new Set<string>()
    return subscribe(
      `support:workspace:${workspaceId}`,
      (event: ServerMsg) => {
        if (event.type !== "presence") return
        const e = event as unknown as {
          userId?: string
          status?: "online" | "offline"
        }
        if (!e.userId) return
        if (e.status === "online") {
          onlineSet.add(e.userId)
          setOnline(true)
        } else if (e.status === "offline") {
          onlineSet.delete(e.userId)
          if (onlineSet.size === 0) setOnline(false)
        }
      },
    )
  }, [workspaceId])

  return online
}
