"use client"

import { MessageSquare } from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"

import { EmptyHint } from "@/components/common/empty-hint"
import { InfiniteScrollSentinel } from "@/components/common/infinite-scroll-sentinel"
import { useProfileCommentsInfiniteQuery } from "@/hooks/queries/use-profile"
import { renderLinkifiedText } from "@/lib/linkify"
import { formatRelativeTime } from "@/lib/relative-time"

// Comments tab. Each row shows the comment body (clamped) plus a link
// to the post + board it lives on. Different shape from CommentItem
// because the context isn't a single post — every row carries its own
// post link.
export function ProfileCommentList({
  workspaceSlug,
  actorId,
}: {
  workspaceSlug: string
  actorId: string
}) {
  const query = useProfileCommentsInfiniteQuery({ workspaceSlug, actorId })
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query

  const comments = useMemo(
    () => query.data?.pages.flatMap((p) => p.comments) ?? [],
    [query.data],
  )

  if (comments.length === 0 && !query.isLoading) {
    return (
      <EmptyHint
        variant="soft"
        icon={MessageSquare}
        title="No comments yet"
        description="Replies and discussion this person leaves will show up here."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {comments.map((c) => {
        const postHref = `/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(c.board.slug)}/${encodeURIComponent(c.post.id)}`
        return (
          <article
            key={c.id}
            className="rounded-xl border border-border bg-card p-5"
          >
            <p className="line-clamp-3 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-foreground/90">
              {renderLinkifiedText(c.body)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] text-muted-foreground">
              <span>on</span>
              <Link
                href={postHref}
                className="font-medium text-foreground hover:underline underline-offset-2"
              >
                {c.post.title}
              </Link>
              <span aria-hidden>·</span>
              <span>{c.board.name}</span>
              <span aria-hidden>·</span>
              <time
                dateTime={c.createdAt}
                className="font-mono tabular-nums"
                title={new Date(c.createdAt).toLocaleString()}
              >
                {formatRelativeTime(c.createdAt)}
              </time>
            </div>
          </article>
        )
      })}
      <InfiniteScrollSentinel
        hasNextPage={hasNextPage ?? false}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
      />
    </div>
  )
}
