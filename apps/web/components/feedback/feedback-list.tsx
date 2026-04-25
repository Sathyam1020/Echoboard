"use client"

import { Inbox, SearchX } from "lucide-react"
import { useMemo, useState } from "react"

import type { PostRow } from "@/components/boards/types"
import { EmptyHint } from "@/components/common/empty-hint"

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
        search.trim().length > 0 ? (
          <EmptyHint
            icon={SearchX}
            title="No matching posts"
            description="Try a different search."
          />
        ) : (
          <EmptyHint
            icon={Inbox}
            title="No posts yet"
            description="When users submit feedback, it shows up here."
          />
        )
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
