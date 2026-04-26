import { Skeleton } from "@workspace/ui/components/skeleton"

// 3 stacked card skeletons inside a column wrapper. Used in both
// public + admin roadmap views during initial load.
function RoadmapCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-3">
      <Skeleton className="h-3.5 w-4/5" />
      <Skeleton className="h-3 w-full" />
      <div className="mt-1 flex items-center gap-1.5">
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
    </div>
  )
}

export function RoadmapColumnSkeleton({
  count = 3,
}: {
  count?: number
}) {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      <Skeleton className="h-5 w-24" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <RoadmapCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// Three columns side-by-side — drop-in for the main roadmap layout.
export function RoadmapBoardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3" aria-hidden>
      <RoadmapColumnSkeleton />
      <RoadmapColumnSkeleton />
      <RoadmapColumnSkeleton count={2} />
    </div>
  )
}
