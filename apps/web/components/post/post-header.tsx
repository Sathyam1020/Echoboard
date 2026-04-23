import { cn } from "@workspace/ui/lib/utils"

import { renderLinkifiedText } from "@/lib/linkify"

import { Avatar } from "../boards/avatar"
import type { PostDetail } from "../boards/types"
import { VoteButton } from "../boards/vote-button"

const STATUS_LABEL: Record<string, string> = {
  review: "Under review",
  planned: "Planned",
  progress: "In progress",
  shipped: "Shipped",
}

const KNOWN_STATUSES = new Set(["review", "planned", "progress", "shipped"])

export function PostHeader({ post }: { post: PostDetail }) {
  const statusKey = KNOWN_STATUSES.has(post.status) ? post.status : "review"
  const statusLabel = STATUS_LABEL[statusKey] ?? "Under review"

  return (
    <article className="flex gap-3">
      <VoteButton
        postId={post.id}
        initialCount={post.voteCount}
        initialVoted={post.hasVoted}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h1 className="text-xl font-medium leading-snug -tracking-[0.01em]">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2.5 text-[12px]">
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
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
          {renderLinkifiedText(post.description)}
        </p>
      </div>
    </article>
  )
}
