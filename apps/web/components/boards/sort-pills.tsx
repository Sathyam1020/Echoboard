"use client"

import { cn } from "@workspace/ui/lib/utils"

// Sort matches the server-side cursor pagination contract — "oldest"
// dropped because it requires a different cursor space (asc) the API
// doesn't currently support; visitors who want oldest can keep
// scrolling on Newest.
export type SortOption = "newest" | "votes"

const OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "votes", label: "Most voted" },
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
