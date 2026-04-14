import { ChevronUp } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

const ROADMAP_COLS: {
  status: "planned" | "progress" | "shipped"
  label: string
  cards: { title: string; votes: number }[]
}[] = [
  {
    status: "planned",
    label: "Planned",
    cards: [
      { title: "Custom domain support", votes: 142 },
      { title: "CSV import for feedback", votes: 78 },
      { title: "Saved filter views", votes: 52 },
    ],
  },
  {
    status: "progress",
    label: "In progress",
    cards: [
      { title: "Slack integration", votes: 184 },
      { title: "MRR-weighted sort", votes: 96 },
    ],
  },
  {
    status: "shipped",
    label: "Shipped",
    cards: [
      { title: "Webhooks on status change", votes: 58 },
      { title: "Public changelog", votes: 41 },
    ],
  },
]

export function RoadmapMockup() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {ROADMAP_COLS.map((col) => (
        <div key={col.status}>
          <div className="roadmap-col-header">
            <span className={cn("status-badge", `status-${col.status}`)}>
              {col.label}
            </span>
            <span className="ml-auto font-mono text-[11px] tabular-nums">
              {col.cards.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {col.cards.map((c) => (
              <div
                key={c.title}
                className="rounded-lg border border-border bg-card p-3"
              >
                <p className="text-sm leading-snug font-medium text-foreground">
                  {c.title}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ChevronUp className="size-3" />
                  <span className="font-mono tabular-nums">{c.votes}</span>
                  <span className="text-muted-foreground/50">votes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
