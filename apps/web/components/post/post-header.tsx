import { renderLinkifiedText } from "@/lib/linkify"

import { Avatar } from "../boards/avatar"
import { StatusBadge, isStatusKey } from "../boards/status-icon"
import type { PostDetail } from "../boards/types"
import { VoteButton } from "../boards/vote-button"

// Hero card on the post detail page. The post itself is the page's primary
// content — give it generous padding, large title, and a prominent vote CTA
// so the reader's eye lands on it first.
export function PostHeader({ post }: { post: PostDetail }) {
  const statusKey = isStatusKey(post.status) ? post.status : "review"
  const created = new Date(post.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        {/* Title row — title on the left, vote pill anchored top-right. */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-[26px] font-medium leading-[1.2] -tracking-[0.015em]">
            {post.title}
          </h1>
          <VoteButton
            postId={post.id}
            initialCount={post.voteCount}
            initialVoted={post.hasVoted}
            orientation="horizontal"
          />
        </div>

        {/* Byline: status + author + date */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px] text-muted-foreground">
          <StatusBadge status={statusKey} />
          {post.authorName ? (
            <span className="inline-flex items-center gap-1.5">
              <Avatar name={post.authorName} size={18} />
              <span className="text-foreground/80">{post.authorName}</span>
            </span>
          ) : null}
          <span className="font-mono tabular-nums">{created}</span>
        </div>

        {/* Body */}
        <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.7] text-foreground/90">
          {renderLinkifiedText(post.description)}
        </p>
      </div>
    </article>
  )
}
