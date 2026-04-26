"use client"

import { Button } from "@workspace/ui/components/button"
import { Bell, BellOff } from "lucide-react"
import { useEffect, useState } from "react"

import { isMuted, onMuteChange, setMuted } from "@/lib/support-sound"

// Bell icon next to the Inbox topbar. Toggles localStorage flag that
// gates playSupportChime — visual badges + favicon dot keep working
// regardless. Cross-component sync via onMuteChange (localStorage
// `storage` events don't fire on the same tab that wrote the value).
export function MuteToggle() {
  const [muted, setLocalMuted] = useState(false)

  useEffect(() => {
    setLocalMuted(isMuted())
    return onMuteChange(setLocalMuted)
  }, [])

  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      aria-label={muted ? "Unmute notifications" : "Mute notifications"}
      onClick={() => setMuted(!muted)}
      className="text-muted-foreground hover:text-foreground"
    >
      {muted ? (
        <BellOff className="size-4" aria-hidden />
      ) : (
        <Bell className="size-4" aria-hidden />
      )}
    </Button>
  )
}
