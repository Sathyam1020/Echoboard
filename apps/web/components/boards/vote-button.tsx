"use client"

import { cn } from "@workspace/ui/lib/utils"
import { ChevronUp } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState, useTransition } from "react"

import { useVoteMutation } from "@/hooks/mutations/use-vote-mutation"
import { ApiError } from "@/lib/http/api-error"

import { IdentityModal } from "./identity-modal"
import { useVisitorIdentity } from "./use-visitor-identity"

type Orientation = "vertical" | "horizontal"

// Tiny vote-count rolodex. Keying the span on the count value makes
// AnimatePresence treat each new number as a fresh element — old slides
// out, new slides in. `popLayout` keeps siblings from jumping during the
// crossover.
function FlippingCount({ count }: { count: number }) {
  return (
    <span className="relative inline-flex items-baseline overflow-hidden font-mono tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={count}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="inline-block"
        >
          {count}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function VoteButton({
  postId,
  initialCount,
  initialVoted,
  orientation = "vertical",
  workspaceId,
  workspaceOwnerId,
  workspaceSlug,
  boardSlug,
}: {
  postId: string
  initialCount: number
  initialVoted: boolean
  orientation?: Orientation
  // Optional so the component still works on admin pages where the visitor
  // path doesn't apply (admin auth via session cookie carries the action).
  workspaceId?: string
  workspaceOwnerId?: string
  // When provided, the public-board react-query cache is optimistically
  // updated alongside the local state — surrounding list re-renders see
  // the new count without waiting for the server.
  workspaceSlug?: string
  boardSlug?: string
}) {
  const [count, setCount] = useState(initialCount)
  const [voted, setVoted] = useState(initialVoted)
  const [isPending, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)

  const identityCtx = useVisitorIdentity({
    workspaceId: workspaceId ?? "",
    workspaceOwnerId: workspaceOwnerId ?? "",
  })

  const voteMutation = useVoteMutation({ postId })

  async function performVote() {
    const prevCount = count
    const prevVoted = voted
    setVoted(!prevVoted)
    setCount(prevVoted ? prevCount - 1 : prevCount + 1)
    try {
      const res = await voteMutation.mutateAsync()
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
        <motion.button
          type="button"
          onClick={onClick}
          disabled={isPending}
          aria-pressed={voted}
          title={title}
          whileTap={{ scale: 0.92 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          className={cn(
            "inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[12px] font-medium transition-colors",
            voted
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            isPending && "cursor-not-allowed opacity-60",
          )}
        >
          <ChevronUp className="size-3.5" aria-hidden strokeWidth={2.5} />
          <FlippingCount count={count} />
        </motion.button>
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
      <motion.button
        type="button"
        onClick={onClick}
        disabled={isPending}
        aria-pressed={voted}
        title={title}
        whileTap={{ scale: 0.94 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        className={cn(
          "vote-btn",
          voted && "vote-active",
          isPending && "cursor-not-allowed opacity-60",
        )}
      >
        <ChevronUp className="size-4" aria-hidden />
        <FlippingCount count={count} />
      </motion.button>
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
