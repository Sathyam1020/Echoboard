import { StatusIcon, type StatusKey } from "@/components/boards/status-icon"
import type { PostRow } from "@/components/boards/types"

const ROWS: { key: Extract<StatusKey, "planned" | "progress" | "shipped">; label: string }[] = [
  { key: "planned", label: "Planned" },
  { key: "progress", label: "In progress" },
  { key: "shipped", label: "Shipped" },
]

export function RoadmapStatsCard({ posts }: { posts: PostRow[] }) {
  const counts = { planned: 0, progress: 0, shipped: 0 }
  for (const p of posts) {
    if (p.status === "planned") counts.planned += 1
    else if (p.status === "progress") counts.progress += 1
    else if (p.status === "shipped") counts.shipped += 1
  }

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="mb-3.5 text-[13px] font-medium text-foreground">
        Roadmap status
      </div>
      <ul className="flex flex-col gap-2.5">
        {ROWS.map((r) => (
          <li
            key={r.key}
            className="flex items-center justify-between gap-2 text-[13px]"
          >
            <span className="flex items-center gap-2 text-foreground">
              <StatusIcon status={r.key} size={13} />
              {r.label}
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {counts[r.key]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
