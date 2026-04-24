import { MessageSquare, Pin } from "lucide-react"
import Link from "next/link"

import { Avatar } from "@/components/boards/avatar"
import { StatusBadge, isStatusKey } from "@/components/boards/status-icon"
import type { PostRow } from "@/components/boards/types"
import { VoteButton } from "@/components/boards/vote-button"

export function FeedbackCard({ post }: { post: PostRow }) {
  const statusKey = isStatusKey(post.status) ? post.status : "review"
  const pinned = Boolean(post.pinnedAt)

  const href = `/dashboard/feedback/${encodeURIComponent(post.id)}`

  return (
    <article className="feedback-card group">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-start gap-1.5 rounded-md outline-none"
        >
          {pinned ? (
            <Pin
              className="mt-0.5 size-3.5 shrink-0 rotate-45 fill-foreground/20 text-foreground"
              aria-label="Pinned"
            />
          ) : null}
          <h3 className="truncate text-[14.5px] font-medium leading-snug -tracking-[0.005em] group-hover:underline group-hover:underline-offset-2">
            {post.title}
          </h3>
        </Link>
        <VoteButton
          postId={post.id}
          initialCount={post.voteCount}
          initialVoted={post.hasVoted}
          orientation="horizontal"
        />
      </div>

      <Link
        href={href}
        className="block rounded-md outline-none"
        tabIndex={-1}
      >
        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {post.description}
        </p>
      </Link>

      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-muted-foreground">
        <StatusBadge status={statusKey} />
        {post.authorName ? (
          <span className="inline-flex items-center gap-1.5">
            <Avatar name={post.authorName} size={18} />
            <span className="truncate">{post.authorName}</span>
          </span>
        ) : null}
        <span className="font-mono tabular-nums">
          {new Date(post.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
        {post.commentCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3.5" aria-hidden />
            <span className="font-mono tabular-nums">
              {post.commentCount}
            </span>
          </span>
        ) : null}
      </div>
    </article>
  )
}
