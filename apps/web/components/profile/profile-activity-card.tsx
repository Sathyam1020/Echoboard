import { cn } from "@workspace/ui/lib/utils"

const WEEKS = 12
const ROWS = 3

// 12-week contribution heatmap. Backend pre-buckets the weeks (index 0 =
// oldest, index 11 = current) so this component is purely visual —
// mirrors the look of `ProductActivityCard` on the changelog page.
export function ProfileActivityCard({
  activity,
}: {
  /** Length-12 array of contribution counts per week. */
  activity: number[]
}) {
  // Defensive — if a stale cache delivers a different length, pad/trim.
  const weeks = activity.slice(-WEEKS)
  while (weeks.length < WEEKS) weeks.unshift(0)
  const total = weeks.reduce((a, b) => a + b, 0)

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="mb-3.5 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-foreground">Activity</span>
        <span className="text-[11px] text-muted-foreground">Last 12 weeks</span>
      </div>

      <div className="mb-3.5 flex items-stretch justify-between gap-1">
        {weeks.map((count, weekIdx) => (
          <div
            key={weekIdx}
            className="flex flex-1 flex-col items-center gap-1"
          >
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
          {total} {total === 1 ? "contribution" : "contributions"}
        </span>
        <span className="text-muted-foreground">{" "}in 12 weeks</span>
      </div>
    </div>
  )
}
