"use client"

import { cn } from "@workspace/ui/lib/utils"
import { ChevronUp } from "lucide-react"
import { useState, useTransition } from "react"

import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/api"

type Orientation = "vertical" | "horizontal"

// Vertical = hero spot on post-detail pages (chunky block).
// Horizontal = compact inline pill for cards (title-row corner).
export function VoteButton({
  postId,
  initialCount,
  initialVoted,
  orientation = "vertical",
}: {
  postId: string
  initialCount: number
  initialVoted: boolean
  orientation?: Orientation
}) {
  const { data: session } = authClient.useSession()
  const authed = Boolean(session)

  const [count, setCount] = useState(initialCount)
  const [voted, setVoted] = useState(initialVoted)
  const [isPending, startTransition] = useTransition()

  const disabled = !authed || isPending

  function onClick(e: React.MouseEvent) {
    // Cards wrap the vote button in a Link — stop the click from navigating.
    e.preventDefault()
    e.stopPropagation()
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

  const title = authed ? (voted ? "Remove vote" : "Vote") : "Sign in to vote"

  if (orientation === "horizontal") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={voted}
        title={title}
        className={cn(
          "inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[12px] font-medium transition-colors",
          voted
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <ChevronUp className="size-3.5" aria-hidden strokeWidth={2.5} />
        <span className="font-mono tabular-nums">{count}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={voted}
      title={title}
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
