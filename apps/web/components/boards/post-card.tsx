import { MessageSquare, Pin } from "lucide-react"
import Link from "next/link"

import { formatRelativeTime } from "@/lib/relative-time"

import { Avatar } from "./avatar"
import { StatusBadge, isStatusKey } from "./status-icon"
import type { PostRow } from "./types"
import { VoteButton } from "./vote-button"

export function PostCard({
  post,
  workspaceSlug,
  boardSlug,
  workspaceId,
  workspaceOwnerId,
}: {
  post: PostRow
  workspaceSlug: string
  boardSlug: string
  workspaceId: string
  workspaceOwnerId: string
}) {
  const statusKey = isStatusKey(post.status) ? post.status : "review"
  const pinned = Boolean(post.pinnedAt)

  const href = `/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(
    boardSlug,
  )}/${encodeURIComponent(post.id)}`

  return (
    <article className="feedback-card group">
      {/* Title row: pin + title on the left, compact vote pill on the right. */}
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
          workspaceId={workspaceId}
          workspaceOwnerId={workspaceOwnerId}
        />
      </div>

      {/* Description */}
      <Link
        href={href}
        className="block rounded-md outline-none"
        tabIndex={-1}
      >
        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {post.description}
        </p>
      </Link>

      {/* Latest-comment preview (optional) */}
      {post.latestComment ? (
        <div className="rounded-md border border-border/60 bg-muted/40 p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <MessageSquare className="size-3" aria-hidden />
            <span className="font-medium text-foreground">
              {post.latestComment.author?.name ?? "Deleted user"}
            </span>
            <span>replied</span>
            <span aria-hidden>·</span>
            <span className="font-mono tabular-nums">
              {formatRelativeTime(post.latestComment.createdAt)}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed">
            {post.latestComment.body}
          </p>
        </div>
      ) : null}

      {/* Meta row — status, author, date, comment count */}
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
