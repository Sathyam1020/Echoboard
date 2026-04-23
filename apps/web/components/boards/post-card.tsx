import { cn } from "@workspace/ui/lib/utils"
import { MessageSquare } from "lucide-react"
import Link from "next/link"

import { formatRelativeTime } from "@/lib/relative-time"

import { Avatar } from "./avatar"
import type { PostRow } from "./types"
import { VoteButton } from "./vote-button"

const STATUS_LABEL: Record<string, string> = {
  review: "Under review",
  planned: "Planned",
  progress: "In progress",
  shipped: "Shipped",
}

const KNOWN_STATUSES = new Set(["review", "planned", "progress", "shipped"])

export function PostCard({
  post,
  workspaceSlug,
  boardSlug,
}: {
  post: PostRow
  workspaceSlug: string
  boardSlug: string
}) {
  const statusKey = KNOWN_STATUSES.has(post.status) ? post.status : "review"
  const statusLabel = STATUS_LABEL[statusKey] ?? "Under review"

  const href = `/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(
    boardSlug,
  )}/${encodeURIComponent(post.id)}`

  return (
    <article className="feedback-card">
      <VoteButton
        postId={post.id}
        initialCount={post.voteCount}
        initialVoted={post.hasVoted}
      />
      <Link
        href={href}
        className="flex min-w-0 flex-1 flex-col gap-1 rounded-md outline-none"
      >
        <h3 className="text-sm font-medium leading-snug">{post.title}</h3>
        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {post.description}
        </p>
        {post.latestComment ? (
          <div className="mt-2 rounded-md border border-border/60 bg-muted/40 p-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MessageSquare className="size-3" aria-hidden />
              <span className="font-medium text-foreground">
                {post.latestComment.author?.name ?? "Deleted user"}
              </span>
              <span>replied</span>
              <span>·</span>
              <span className="font-mono tabular-nums">
                {formatRelativeTime(post.latestComment.createdAt)}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed">
              {post.latestComment.body}
            </p>
          </div>
        ) : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-[12px]">
          <span
            className={cn("status-badge !text-[11px]", `status-${statusKey}`)}
          >
            {statusLabel}
          </span>
          {post.authorName ? (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Avatar name={post.authorName} size={18} />
              {post.authorName}
            </span>
          ) : null}
          <span className="font-mono tabular-nums text-muted-foreground">
            {new Date(post.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
          {post.commentCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="size-3.5" aria-hidden />
              <span className="font-mono tabular-nums">
                {post.commentCount}
              </span>
            </span>
          ) : null}
        </div>
      </Link>
    </article>
  )
}
