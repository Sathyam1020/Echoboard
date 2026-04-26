"use client"

import { useEffect, useRef, useState } from "react"

import {
  subscribe,
  type ServerMsg,
} from "@/lib/realtime/socket-client"

// Returns true while the OTHER party is typing in the given conversation.
// Auto-clears 4.5s after the latest "isTyping: true" event so a dropped
// "isTyping: false" doesn't leave the dots stuck on. Self-fired typing
// events are ignored — the typer doesn't need to see their own dots.
export function useTypingIndicator({
  conversationId,
  selfActorId,
}: {
  conversationId: string | null
  selfActorId: string | null
}): boolean {
  const [typingUntil, setTypingUntil] = useState<number | null>(null)
  // Re-render every second so the boolean flips false on its own when
  // the auto-clear timestamp passes. Keyed off conversationId so the
  // interval resets when switching threads.
  const tickRef = useRef(0)
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!conversationId) return
    const id = setInterval(() => {
      tickRef.current += 1
      setTick(tickRef.current)
    }, 1000)
    return () => clearInterval(id)
  }, [conversationId])

  useEffect(() => {
    if (!conversationId) {
      setTypingUntil(null)
      return
    }
    return subscribe(
      `support:conversation:${conversationId}`,
      (event: ServerMsg) => {
        if (event.type !== "typing") return
        const e = event as unknown as {
          actorId?: string
          isTyping?: boolean
        }
        // Ignore self-typing.
        if (e.actorId && selfActorId && e.actorId === selfActorId) return
        if (e.isTyping) {
          setTypingUntil(Date.now() + 4500)
        } else {
          setTypingUntil(null)
        }
      },
    )
  }, [conversationId, selfActorId])

  if (typingUntil === null) return false
  return typingUntil > Date.now()
}
