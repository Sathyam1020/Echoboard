"use client"

import { cn } from "@workspace/ui/lib/utils"
import { useState, useTransition } from "react"

import { api } from "@/lib/api"

type StatusKey = "review" | "planned" | "progress" | "shipped"

const STATUSES: Array<{ key: StatusKey; label: string; dotVar: string }> = [
  {
    key: "review",
    label: "Under review",
    dotVar: "var(--status-review-dot)",
  },
  {
    key: "planned",
    label: "Planned",
    dotVar: "var(--status-planned-dot)",
  },
  {
    key: "progress",
    label: "In progress",
    dotVar: "var(--status-progress-dot)",
  },
  {
    key: "shipped",
    label: "Shipped",
    dotVar: "var(--status-shipped-dot)",
  },
]

function isStatusKey(value: string): value is StatusKey {
  return (
    value === "review" ||
    value === "planned" ||
    value === "progress" ||
    value === "shipped"
  )
}

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

  function onSelect(next: StatusKey) {
    if (isPending || next === current) return
    const prev = current
    setCurrent(next)
    setError(null)
    startTransition(async () => {
      try {
        const res = await api.patch<{ post: { id: string; status: string } }>(
          `/api/posts/${postId}/status`,
          { status: next },
        )
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
          const active = s.key === current
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelect(s.key)}
              disabled={isPending}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
                isPending && "cursor-not-allowed opacity-60",
              )}
            >
              <span
                aria-hidden
                className="block size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.dotVar }}
              />
              {s.label}
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
