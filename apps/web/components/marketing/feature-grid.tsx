import { cn } from "@workspace/ui/lib/utils"
import type { LucideIcon } from "lucide-react"

// Grid of icon + title + description cards. Used on use-case pages to
// surface the most relevant EchoBoard features for a given audience, and
// (eventually) on the landing page for the feature lineup.
export type FeatureGridItem = {
  icon: LucideIcon
  title: string
  description: string
}

export function FeatureGrid({
  items,
  columns = 3,
  className,
}: {
  items: FeatureGridItem[]
  columns?: 2 | 3 | 4
  className?: string
}) {
  const gridClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3"

  return (
    <div className={cn("grid grid-cols-1 gap-4", gridClass, className)}>
      {items.map(({ icon: Icon, title, description }) => (
        <div
          key={title}
          className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-5"
        >
          <div
            aria-hidden
            className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <Icon className="size-4" />
          </div>
          <div className="text-[14px] font-medium">{title}</div>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      ))}
    </div>
  )
}
