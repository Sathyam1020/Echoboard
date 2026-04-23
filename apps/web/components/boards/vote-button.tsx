"use client"

import { cn } from "@workspace/ui/lib/utils"
import { ChevronUp } from "lucide-react"
import { useState, useTransition } from "react"

import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/api"

export function VoteButton({
  postId,
  initialCount,
  initialVoted,
}: {
  postId: string
  initialCount: number
  initialVoted: boolean
}) {
  const { data: session } = authClient.useSession()
  const authed = Boolean(session)

  const [count, setCount] = useState(initialCount)
  const [voted, setVoted] = useState(initialVoted)
  const [isPending, startTransition] = useTransition()

  const disabled = !authed || isPending

  function onClick() {
    if (!authed || isPending) return
    const prevCount = count
    const prevVoted = voted
    setVoted(!prevVoted)
    setCount(prevVoted ? prevCount - 1 : prevCount + 1)
    startTransition(async () => {
      try {
        const res = await api.post<{ hasVoted: boolean; voteCount: number }>(
          `/api/posts/${postId}/vote`,
          {},
        )
        setVoted(res.hasVoted)
        setCount(res.voteCount)
      } catch {
        setVoted(prevVoted)
        setCount(prevCount)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={voted}
      title={authed ? (voted ? "Remove vote" : "Vote") : "Sign in to vote"}
      className={cn(
        "vote-btn",
        voted && "vote-active",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <ChevronUp className="size-4" aria-hidden />
      <span className="font-mono tabular-nums">{count}</span>
    </button>
  )
}
