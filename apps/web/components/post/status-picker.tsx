"use client"

import { cn } from "@workspace/ui/lib/utils"
import { useState, useTransition } from "react"

import {
  STATUS_LABEL,
  StatusIcon,
  isStatusKey,
  type StatusKey,
} from "@/components/boards/status-icon"
import { useUpdatePostStatusMutation } from "@/hooks/use-posts"

const STATUSES: StatusKey[] = ["review", "planned", "progress", "shipped"]

export function StatusPicker({
  postId,
  initialStatus,
}: {
  postId: string
  initialStatus: string
}) {
  const normalized: StatusKey = isStatusKey(initialStatus)
    ? initialStatus
    : "review"

  const [current, setCurrent] = useState<StatusKey>(normalized)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const mutation = useUpdatePostStatusMutation(postId)

  function onSelect(next: StatusKey) {
    if (isPending || next === current) return
    const prev = current
    setCurrent(next)
    setError(null)
    startTransition(async () => {
      try {
        const res = await mutation.mutateAsync(next)
        if (isStatusKey(res.post.status)) {
          setCurrent(res.post.status)
        }
      } catch (err) {
        setCurrent(prev)
        setError(
          err instanceof Error ? err.message : "Failed to update status",
        )
      }
    })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUSES.map((s) => {
          const active = s === current
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(s)}
              disabled={isPending}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active
                  ? "border-foreground/20 bg-muted text-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
                isPending && "cursor-not-allowed opacity-60",
              )}
            >
              <StatusIcon status={s} size={12} />
              {STATUS_LABEL[s]}
            </button>
          )
        })}
      </div>
      {error ? (
        <span className="text-[12px] text-destructive">{error}</span>
      ) : null}
    </div>
  )
}
