"use client"

import { useEffect, useRef } from "react"

import { sendOverSocket } from "@/lib/realtime/socket-client"

// Returns a `notifyKeystroke()` function that sends a throttled typing
// event for a conversation. First keystroke after idle fires `isTyping:
// true`; subsequent keystrokes within 1s are throttled. After 4s of no
// keystrokes (or on unmount) we send `isTyping: false` so the receiver
// can clear their indicator without waiting for the 4.5s timeout.
export function useTypingSender(conversationId: string | null) {
  const lastSentAt = useRef(0)
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (stopTimer.current) clearTimeout(stopTimer.current)
      if (conversationId) {
        sendOverSocket({
          type: "typing",
          conversationId,
          isTyping: false,
        })
      }
    }
  }, [conversationId])

  return {
    notifyKeystroke(): void {
      if (!conversationId) return
      const now = Date.now()
      if (now - lastSentAt.current > 1000) {
        sendOverSocket({
          type: "typing",
          conversationId,
          isTyping: true,
        })
        lastSentAt.current = now
      }
      if (stopTimer.current) clearTimeout(stopTimer.current)
      stopTimer.current = setTimeout(() => {
        sendOverSocket({
          type: "typing",
          conversationId,
          isTyping: false,
        })
        lastSentAt.current = 0
      }, 4000)
    },
    stopNow(): void {
      if (!conversationId) return
      if (stopTimer.current) clearTimeout(stopTimer.current)
      stopTimer.current = null
      lastSentAt.current = 0
      sendOverSocket({
        type: "typing",
        conversationId,
        isTyping: false,
      })
    },
  }
}
