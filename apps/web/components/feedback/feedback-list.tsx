"use client"

import { useMemo, useState } from "react"

import type { PostRow } from "@/components/boards/types"

import { FeedbackCard } from "./feedback-card"
import {
  FeedbackFilterPills,
  type FeedbackSort,
} from "./feedback-filter-pills"
import { FeedbackSearch } from "./feedback-search"

export function FeedbackList({ posts }: { posts: PostRow[] }) {
  const [sort, setSort] = useState<FeedbackSort>("votes")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = posts
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      )
    }
    // Pinned posts always come first, regardless of sort.
    const pinned = list.filter((p) => p.pinnedAt)
    const rest = list.filter((p) => !p.pinnedAt)

    const sorter = (a: PostRow, b: PostRow) => {
      if (sort === "votes") return b.voteCount - a.voteCount
      if (sort === "newest")
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      // trending — most comments first
      return b.commentCount - a.commentCount
    }

    pinned.sort(sorter)
    rest.sort(sorter)
    return [...pinned, ...rest]
  }, [posts, sort, search])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FeedbackFilterPills value={sort} onChange={setSort} />
        <FeedbackSearch value={search} onChange={setSearch} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState hasSearch={search.trim().length > 0} />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((p) => (
            <FeedbackCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  if (hasSearch) {
    return (
      <div className="empty-state rounded-lg border border-border bg-card px-6 py-12 text-center">
        <p className="text-sm font-medium">No matching posts</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Try a different search.
        </p>
      </div>
    )
  }
  return (
    <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
      <p className="text-sm font-medium">No posts yet</p>
      <p className="mt-1 text-[13px] text-muted-foreground">
        When users submit feedback, it shows up here.
      </p>
    </div>
  )
}
