"use client"

import { useEffect, useState } from "react"

import {
  getConnectionState,
  onConnectionState,
  type ConnectionState,
} from "@/lib/realtime/socket-client"

// Subscribes to the singleton socket's connection-state changes. Used
// to drive the "Reconnecting…" banner that surfaces when realtime is
// degraded for longer than a couple of seconds.
//
// Optionally debounces transitions so a quick blip doesn't flash the
// banner — the default 2000ms covers most "lost packet, recovered" cases
// without false-positiving.
export function useConnectionState({
  reconnectingBannerDelayMs = 2000,
}: {
  reconnectingBannerDelayMs?: number
} = {}): {
  state: ConnectionState
  showReconnecting: boolean
} {
  const [state, setState] = useState<ConnectionState>(getConnectionState())
  const [showReconnecting, setShowReconnecting] = useState(false)

  useEffect(() => {
    return onConnectionState(setState)
  }, [])

  useEffect(() => {
    if (state !== "reconnecting") {
      setShowReconnecting(false)
      return
    }
    const t = setTimeout(() => setShowReconnecting(true), reconnectingBannerDelayMs)
    return () => clearTimeout(t)
  }, [state, reconnectingBannerDelayMs])

  return { state, showReconnecting }
}
