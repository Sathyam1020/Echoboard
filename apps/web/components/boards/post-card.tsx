import { cn } from "@workspace/ui/lib/utils"

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

export function PostCard({ post }: { post: PostRow }) {
  const statusKey = KNOWN_STATUSES.has(post.status) ? post.status : "review"
  const statusLabel = STATUS_LABEL[statusKey] ?? "Under review"

  return (
    <article className="feedback-card">
      <VoteButton
        postId={post.id}
        initialCount={post.voteCount}
        initialVoted={post.hasVoted}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-sm font-medium leading-snug">{post.title}</h3>
        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {post.description}
        </p>
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
        </div>
      </div>
    </article>
  )
}
