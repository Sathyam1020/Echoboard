"use client"

import { Loader2 } from "lucide-react"

import { useConnectionState } from "@/hooks/realtime/use-connection-state"

// Subtle banner shown at the top of a chat surface when the WebSocket
// has been in the reconnecting state for >2s. Disappears within 500ms
// of recovery (handled by the hook's debounce snap-back). The banner
// is informational — REST + the reconnect-refetch on use-support-socket
// reconnect cover correctness; this just tells the user "real-time is
// catching up" so a missing live update isn't misread as a bug.
export function ReconnectingBanner() {
  const { showReconnecting } = useConnectionState()

  if (!showReconnecting) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[12px] text-amber-700 dark:text-amber-300"
    >
      <Loader2
        className="size-3.5 motion-safe:animate-spin"
        aria-hidden
      />
      Reconnecting…
    </div>
  )
}
