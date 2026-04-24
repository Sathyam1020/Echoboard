import { MessageSquare } from "lucide-react"
import Link from "next/link"

import type { PostRow } from "@/components/boards/types"

export function RoadmapCard({
  post,
  href,
}: {
  post: PostRow
  href: string
}) {
  return (
    <Link
      href={href}
      className="block rounded-md border border-border bg-card px-3 py-2.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <h3 className="text-[13px] font-medium leading-snug">{post.title}</h3>
      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="font-mono tabular-nums">{post.voteCount} votes</span>
        {post.commentCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3" aria-hidden />
            <span className="font-mono tabular-nums">{post.commentCount}</span>
          </span>
        ) : null}
      </div>
    </Link>
  )
}
