"use client"

import { cn } from "@workspace/ui/lib/utils"
import { TrendingUp } from "lucide-react"
import type { ComponentType, SVGProps } from "react"

export type FeedbackSort = "votes" | "newest" | "trending"

const OPTIONS: Array<{
  value: FeedbackSort
  label: string
  icon?: ComponentType<SVGProps<SVGSVGElement>>
}> = [
  { value: "votes", label: "Most voted" },
  { value: "newest", label: "Newest" },
  { value: "trending", label: "Trending", icon: TrendingUp },
]

export function FeedbackFilterPills({
  value,
  onChange,
}: {
  value: FeedbackSort
  onChange: (value: FeedbackSort) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {OPTIONS.map((o) => {
        const Icon = o.icon
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "filter-pill",
              value === o.value ? "filter-active" : "",
            )}
          >
            {Icon ? <Icon className="size-3" aria-hidden /> : null}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
