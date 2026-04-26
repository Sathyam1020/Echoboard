import { Skeleton } from "@workspace/ui/components/skeleton"

// Mirrors `PostCard`'s outer dimensions + internal block layout so
// swapping skeleton → real content produces zero layout shift.
export function PostCardSkeleton() {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-1.5">
          <Skeleton className="h-4 w-3/5" />
        </div>
        {/* Vote pill placeholder */}
        <Skeleton className="h-8 w-12 rounded-full" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>

      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px]">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-3 w-12" />
      </div>
    </article>
  )
}

// Convenience wrapper — common case is N skeletons stacked.
export function PostCardSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}
