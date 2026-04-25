import { type ReactNode } from "react"

import { StatusIcon, STATUS_LABEL } from "@/components/boards/status-icon"

export type RoadmapColumnKey = "planned" | "progress" | "shipped"

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
  return (
    <section
      className={`flex min-h-[200px] flex-col gap-3 rounded-lg border p-3 transition-colors ${
        highlighted
          ? "border-foreground/30 bg-muted/70"
          : "border-border bg-muted/40"
      }`}
    >
      <header className="flex items-center gap-2 px-1">
        <StatusIcon status={columnKey} size={14} />
        <h2 className="text-[13px] font-medium">{STATUS_LABEL[columnKey]}</h2>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {count}
        </span>
      </header>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}
