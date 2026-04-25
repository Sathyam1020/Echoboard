import { cn } from "@workspace/ui/lib/utils"

import type { PublicChangelogEntry } from "./types"

const WEEKS = 12
const ROWS = 3

export function ProductActivityCard({
  entries,
}: {
  entries: PublicChangelogEntry[]
}) {
  // Bucket entries into the last 12 weeks. Index 0 = oldest week (left),
  // index 11 = current week (right).
  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const weekly: number[] = Array(WEEKS).fill(0)

  for (const e of entries) {
    if (!e.publishedAt) continue
    const ts = new Date(e.publishedAt).getTime()
    if (Number.isNaN(ts)) continue
    const weeksAgo = Math.floor((now - ts) / weekMs)
    if (weeksAgo >= 0 && weeksAgo < WEEKS) {
      weekly[WEEKS - 1 - weeksAgo]! += 1
    }
  }

  const total = weekly.reduce((a, b) => a + b, 0)

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="mb-3.5 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-foreground">
          Product activity
        </span>
        <span className="text-[11px] text-muted-foreground">Last 12 weeks</span>
      </div>

      <div className="mb-3.5 flex items-stretch justify-between gap-1">
        {weekly.map((count, weekIdx) => (
          <div
            key={weekIdx}
            className="flex flex-1 flex-col items-center gap-1"
          >
            {/* Top row first (rowIdx 0 = top, ROWS-1 = bottom). Fill from
                bottom up so high-volume weeks are visually "loaded". */}
            {Array.from({ length: ROWS }).map((_, rowIdx) => {
              const fromBottom = ROWS - 1 - rowIdx
              const filled = count > fromBottom
              return (
                <span
                  key={rowIdx}
                  className={cn(
                    "size-1.5 rounded-full",
                    filled ? "bg-emerald-500" : "bg-muted",
                  )}
                  aria-hidden
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="text-[12px]">
        <span className="font-medium text-foreground">
          {total} {total === 1 ? "request" : "requests"}
        </span>
        <span className="text-muted-foreground">
          {" "}completed in 12 weeks
        </span>
      </div>
    </div>
  )
}
