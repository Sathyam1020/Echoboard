"use client"

import { cn } from "@workspace/ui/lib/utils"

import type { ConversationStatus } from "./types"

type Value = {
  status?: ConversationStatus
  mine?: boolean
}

const STATUS_TABS: Array<{
  id: "all" | "open" | "pending" | "resolved" | "mine"
  label: string
}> = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "pending", label: "Pending" },
  { id: "resolved", label: "Resolved" },
  { id: "mine", label: "Mine" },
]

export function StatusFilter({
  value,
  onChange,
}: {
  value: Value
  onChange: (next: Value) => void
}) {
  const activeId =
    value.mine
      ? "mine"
      : value.status ?? "all"

  return (
    <div
      role="tablist"
      aria-label="Conversation filter"
      className="flex gap-1 overflow-x-auto px-3 py-2"
    >
      {STATUS_TABS.map((tab) => {
        const isActive = activeId === tab.id
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => {
              if (tab.id === "all") onChange({})
              else if (tab.id === "mine") onChange({ mine: true })
              else onChange({ status: tab.id })
            }}
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
              isActive
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
