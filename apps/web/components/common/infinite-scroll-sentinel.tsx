"use client"

import { Loader2 } from "lucide-react"
import { useEffect, useRef } from "react"

// IntersectionObserver-driven trigger that fires `onLoadMore` when its
// sentinel scrolls into the viewport. Used at the bottom of every
// paginated list — board feed, all-feedback, changelog, comments — to
// kick off `fetchNextPage` without an explicit "Load more" button.
//
// `rootMargin: 200px` triggers slightly before the sentinel is visible
// so the next batch starts loading just before the user reaches the
// gap. Subjective but feels smoother than waiting until it's flush.
export function InfiniteScrollSentinel({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  /** Optional copy shown when there's nothing left to load. */
  endLabel = "You've reached the end.",
}: {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
  endLabel?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!hasNextPage) return
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry || !entry.isIntersecting) return
        // Don't double-fire while a fetch is in-flight; the parent
        // hook's enabled-state guard catches this too but spelling it
        // out here means we don't depend on `useInfiniteQuery`'s
        // implementation detail.
        onLoadMore()
      },
      { rootMargin: "200px 0px" },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, onLoadMore])

  if (!hasNextPage) {
    // Empty endLabel → render nothing. Useful for "load older" sentinels
    // at the top of a chat thread, where the natural end is the START
    // of the conversation and a label would be misleading.
    if (!endLabel) return null
    return (
      <div className="py-8 text-center text-[12px] text-muted-foreground/70">
        {endLabel}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="flex items-center justify-center py-8 text-[12px] text-muted-foreground"
      aria-live="polite"
    >
      {isFetchingNextPage ? (
        <span className="inline-flex items-center gap-2">
          <Loader2
            className="size-3.5 motion-safe:animate-spin"
            aria-hidden
          />
          Loading more…
        </span>
      ) : (
        <span aria-hidden>·</span>
      )}
    </div>
  )
}
