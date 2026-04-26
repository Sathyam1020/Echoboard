import { Skeleton } from "@workspace/ui/components/skeleton"

// Mirrors `ProfileHeader` — large avatar + name/member-since + stats row.
export function ProfileHeaderSkeleton() {
  return (
    <header className="flex flex-col gap-5" aria-hidden>
      <div className="flex items-center gap-5">
        <Skeleton className="size-16 shrink-0 rounded-full" />
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-border-soft pb-5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </header>
  )
}

// Mirrors the Activity + Impact sidebar cards on the profile page.
export function ProfileSidebarSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-hidden>
      <div className="rounded-xl border border-border bg-background p-4">
        <div className="mb-3.5 flex items-baseline justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="mb-3.5 flex items-stretch justify-between gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <Skeleton className="size-1.5 rounded-full" />
              <Skeleton className="size-1.5 rounded-full" />
              <Skeleton className="size-1.5 rounded-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="rounded-xl border border-border bg-background p-4">
        <Skeleton className="h-3 w-24" />
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-6" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      </div>
    </div>
  )
}
