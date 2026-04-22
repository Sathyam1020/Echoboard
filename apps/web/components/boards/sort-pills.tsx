"use client"

import { cn } from "@workspace/ui/lib/utils"

export type SortOption = "newest" | "oldest"

const OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  // When voting lands, unhide: { value: "votes", label: "Most voted" }
  // When comments land, unhide: { value: "trending", label: "Trending" }
]

export function SortPills({
  value,
  onChange,
}: {
  value: SortOption
  onChange: (value: SortOption) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "filter-pill",
            value === o.value ? "filter-active" : "",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
