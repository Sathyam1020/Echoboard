"use client"

import { cn } from "@workspace/ui/lib/utils"
import { ChevronUp } from "lucide-react"
import { useState, useTransition } from "react"

import { ApiError, api } from "@/lib/api"

import { IdentityModal } from "./identity-modal"
import { useVisitorIdentity } from "./use-visitor-identity"

type Orientation = "vertical" | "horizontal"

export function VoteButton({
  postId,
  initialCount,
  initialVoted,
  orientation = "vertical",
  workspaceId,
  workspaceOwnerId,
}: {
  postId: string
  initialCount: number
  initialVoted: boolean
  orientation?: Orientation
  // Optional so the component still works on admin pages where the visitor
  // path doesn't apply (admin auth via session cookie carries the action).
  workspaceId?: string
  workspaceOwnerId?: string
}) {
  const [count, setCount] = useState(initialCount)
  const [voted, setVoted] = useState(initialVoted)
  const [isPending, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)

  const identityCtx = useVisitorIdentity({
    workspaceId: workspaceId ?? "",
    workspaceOwnerId: workspaceOwnerId ?? "",
  })

  async function performVote() {
    const prevCount = count
    const prevVoted = voted
    setVoted(!prevVoted)
    setCount(prevVoted ? prevCount - 1 : prevCount + 1)
    try {
      const res = await api.post<{ hasVoted: boolean; voteCount: number }>(
        `/api/posts/${postId}/vote`,
        {},
      )
      setVoted(res.hasVoted)
      setCount(res.voteCount)
    } catch (err) {
      setVoted(prevVoted)
      setCount(prevCount)
      if (err instanceof ApiError && err.status === 401) {
        // Cookie/session went stale between resolve and request — re-prompt.
        setModalOpen(true)
      }
    }
  }

  function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (isPending) return

    // Pages without workspace context (e.g. admin dashboard) just rely on
    // the existing admin session — no gating.
    if (!workspaceId || !workspaceOwnerId) {
      startTransition(performVote)
      return
    }

    startTransition(async () => {
      const result = await identityCtx.ensure()
      if (result.kind === "modal") {
        setModalOpen(true)
        return
      }
      await performVote()
    })
  }

  const title = voted ? "Remove vote" : "Vote"

  if (orientation === "horizontal") {
    return (
      <>
        <button
          type="button"
          onClick={onClick}
          disabled={isPending}
          aria-pressed={voted}
          title={title}
          className={cn(
            "inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[12px] font-medium transition-colors",
            voted
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            isPending && "cursor-not-allowed opacity-60",
          )}
        >
          <ChevronUp className="size-3.5" aria-hidden strokeWidth={2.5} />
          <span className="font-mono tabular-nums">{count}</span>
        </button>
        {workspaceId ? (
          <IdentityModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            workspaceId={workspaceId}
            intent="vote"
            onIdentified={(v) => {
              identityCtx.setIdentity(v)
              startTransition(performVote)
            }}
          />
        ) : null}
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        aria-pressed={voted}
        title={title}
        className={cn(
          "vote-btn",
          voted && "vote-active",
          isPending && "cursor-not-allowed opacity-60",
        )}
      >
        <ChevronUp className="size-4" aria-hidden />
        <span className="font-mono tabular-nums">{count}</span>
      </button>
      {workspaceId ? (
        <IdentityModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          workspaceId={workspaceId}
          intent="vote"
          onIdentified={(v) => {
            identityCtx.setIdentity(v)
            startTransition(performVote)
          }}
        />
      ) : null}
    </>
  )
}
