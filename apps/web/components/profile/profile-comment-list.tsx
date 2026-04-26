"use client"

import { Skeleton } from "@workspace/ui/components/skeleton"
import { MessageSquareDashed } from "lucide-react"
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
  isSelf,
  actorName,
}: {
  workspaceSlug: string
  actorId: string
  isSelf?: boolean
  actorName: string
}) {
  const query = useProfileCommentsInfiniteQuery({ workspaceSlug, actorId })
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query

  const comments = useMemo(
    () => query.data?.pages.flatMap((p) => p.comments) ?? [],
    [query.data],
  )

  const isInitialLoading = query.isPending && !query.data

  if (isInitialLoading) {
    return (
      <div className="flex flex-col gap-3" aria-hidden>
        {Array.from({ length: 3 }).map((_, i) => (
          <article
            key={i}
            className="space-y-2 rounded-xl border border-border bg-card p-5"
          >
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="mt-2 h-3 w-40" />
          </article>
        ))}
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <EmptyHint
        variant="soft"
        icon={MessageSquareDashed}
        title={
          isSelf
            ? "You haven't commented yet"
            : `${actorName} hasn't commented yet`
        }
        description={
          isSelf
            ? "Reply to a feedback post and your comments will collect here."
            : "Replies and discussion they leave will show up here."
        }
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
