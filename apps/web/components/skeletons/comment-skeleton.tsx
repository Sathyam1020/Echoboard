import { Skeleton } from "@workspace/ui/components/skeleton"

// Mirrors `CommentItem` at depth=0 (top-level card with avatar + body).
export function CommentSkeleton() {
  return (
    <article className="flex gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="mt-1 flex gap-1.5">
          <Skeleton className="h-6 w-12 rounded-md" />
          <Skeleton className="h-6 w-10 rounded-md" />
        </div>
      </div>
    </article>
  )
}

export function CommentSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-5" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  )
}
