import { Skeleton } from "@workspace/ui/components/skeleton"

// Mirrors a row inside `VoterListCard`. Used during admin post detail
// load.
export function VoterRowSkeleton() {
  return (
    <li className="flex items-center gap-2.5 border-b border-border-soft px-4 py-2.5 last:border-b-0">
      <Skeleton className="size-6 shrink-0 rounded-full" />
      <Skeleton className="h-3 w-28" />
    </li>
  )
}

export function VoterListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section
      className="overflow-hidden rounded-lg border border-border bg-card"
      aria-hidden
    >
      <header className="flex items-baseline justify-between border-b border-border px-4 py-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-10" />
      </header>
      <ul>
        {Array.from({ length: count }).map((_, i) => (
          <VoterRowSkeleton key={i} />
        ))}
      </ul>
    </section>
  )
}
