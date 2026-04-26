import { Skeleton } from "@workspace/ui/components/skeleton"

// Mirrors `PublicEntry` — date column on the left, content column on
// the right, inside a `.changelog-entry` so the timeline rule renders.
export function ChangelogEntrySkeleton() {
  return (
    <div className="changelog-entry flex gap-6 border-b border-border-soft py-8 last:border-b-0">
      <div className="shrink-0 pt-1 text-right sm:w-[120px]">
        <Skeleton className="ml-auto h-3 w-20" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}

export function ChangelogEntrySkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <ChangelogEntrySkeleton key={i} />
      ))}
    </div>
  )
}
