import { type ReactNode } from "react"

export type RoadmapColumnKey = "planned" | "progress" | "shipped"

export const ROADMAP_COLUMN_META: Record<
  RoadmapColumnKey,
  { label: string; dotVar: string }
> = {
  planned: { label: "Planned", dotVar: "var(--status-planned-dot)" },
  progress: { label: "In progress", dotVar: "var(--status-progress-dot)" },
  shipped: { label: "Shipped", dotVar: "var(--status-shipped-dot)" },
}

export function RoadmapColumn({
  columnKey,
  count,
  children,
  highlighted,
}: {
  columnKey: RoadmapColumnKey
  count: number
  children: ReactNode
  highlighted?: boolean
}) {
  const meta = ROADMAP_COLUMN_META[columnKey]
  return (
    <section
      className={`flex min-h-[200px] flex-col gap-3 rounded-lg border bg-card p-3 transition-colors ${
        highlighted ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <header className="flex items-center gap-2 px-1">
        <span
          aria-hidden
          className="size-2 rounded-full"
          style={{ backgroundColor: meta.dotVar }}
        />
        <h2 className="text-[13px] font-medium">{meta.label}</h2>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {count}
        </span>
      </header>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}
