"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Search } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo, useState } from "react"

import { authClient } from "@/lib/auth-client"

import { PostList } from "./post-list"
import { SortPills, type SortOption } from "./sort-pills"
import { SubmitPostDialog } from "./submit-post-dialog"
import type { PostRow } from "./types"

export function BoardPosts({
  boardId,
  posts,
  workspaceSlug,
  boardSlug,
}: {
  boardId: string
  posts: PostRow[]
  workspaceSlug: string
  boardSlug: string
}) {
  const { data: session } = authClient.useSession()
  const pathname = usePathname()
  const signinHref = `/signin?redirectTo=${encodeURIComponent(pathname)}`

  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortOption>("newest")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let arr = posts
    if (q) {
      arr = arr.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      )
    }
    const sorter = (a: PostRow, b: PostRow) => {
      if (sort === "votes") {
        const diff = b.voteCount - a.voteCount
        if (diff !== 0) return diff
        return b.createdAt.localeCompare(a.createdAt)
      }
      const cmp = a.createdAt.localeCompare(b.createdAt)
      return sort === "newest" ? -cmp : cmp
    }
    // Pinned posts always land on top regardless of the selected sort.
    const pinned = arr.filter((p) => p.pinnedAt)
    const rest = arr.filter((p) => !p.pinnedAt)
    pinned.sort(sorter)
    rest.sort(sorter)
    return [...pinned, ...rest]
  }, [posts, search, sort])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feedback…"
            className="pl-10"
          />
        </div>
        {session ? (
          <SubmitPostDialog boardId={boardId} />
        ) : (
          <Button asChild>
            <Link href={signinHref}>Submit</Link>
          </Button>
        )}
      </div>

      <SortPills value={sort} onChange={setSort} />

      <PostList
        posts={filtered}
        workspaceSlug={workspaceSlug}
        boardSlug={boardSlug}
      />
    </div>
  )
}
