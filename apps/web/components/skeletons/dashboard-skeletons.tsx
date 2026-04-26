import { Skeleton } from "@workspace/ui/components/skeleton"

// Mirrors a single board summary tile on the dashboard home.
export function BoardCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-20" />
      <div className="mt-2 flex items-center gap-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  )
}

export function BoardCardSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <BoardCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Mirrors a row in the recent-posts table on the dashboard home.
export function RecentPostRowSkeleton() {
  return (
    <li className="flex items-center gap-3 border-b border-border-soft py-2.5 last:border-b-0">
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </li>
  )
}

export function RecentPostRowSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <ul aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <RecentPostRowSkeleton key={i} />
      ))}
    </ul>
  )
}
