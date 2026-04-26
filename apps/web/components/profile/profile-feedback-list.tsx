"use client"

import { Button } from "@workspace/ui/components/button"
import { Inbox } from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"

import { PostList } from "@/components/boards/post-list"
import type { PostRow } from "@/components/boards/types"
import { EmptyHint } from "@/components/common/empty-hint"
import { InfiniteScrollSentinel } from "@/components/common/infinite-scroll-sentinel"
import { PostCardSkeletonList } from "@/components/skeletons/post-card-skeleton"
import { useProfileFeedbackInfiniteQuery } from "@/hooks/queries/use-profile"

// Feedback tab content. Reuses `PostCard` via `PostList` — the rows
// already render the source-board badge when `post.board` is set,
// which the backend includes for profile feedback.
export function ProfileFeedbackList({
  workspaceSlug,
  workspaceId,
  workspaceOwnerId,
  actorId,
  isSelf,
  actorName,
}: {
  workspaceSlug: string
  workspaceId: string
  workspaceOwnerId: string
  actorId: string
  /** True when the viewer is looking at their own profile — drives
   *  the "you haven't yet" copy + the browse-boards CTA. */
  isSelf?: boolean
  actorName: string
}) {
  const query = useProfileFeedbackInfiniteQuery({ workspaceSlug, actorId })
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query

  const posts: PostRow[] = useMemo(
    () => query.data?.pages.flatMap((p) => p.posts) ?? [],
    [query.data],
  )

  const isInitialLoading = query.isPending && !query.data

  if (isInitialLoading) {
    return <PostCardSkeletonList count={3} />
  }

  if (posts.length === 0) {
    return (
      <EmptyHint
        variant="soft"
        icon={Inbox}
        title={
          isSelf
            ? "You haven't submitted feedback yet"
            : `${actorName} hasn't submitted feedback yet`
        }
        description={
          isSelf
            ? "When you submit a feature request, it'll show up here."
            : "Once they share an idea, it'll show up here."
        }
        action={
          isSelf ? (
            <Button asChild size="sm">
              <Link href={`/${encodeURIComponent(workspaceSlug)}`}>
                Browse boards
              </Link>
            </Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PostList
        posts={posts}
        workspaceSlug={workspaceSlug}
        boardSlug=""
        workspaceId={workspaceId}
        workspaceOwnerId={workspaceOwnerId}
      />
      <InfiniteScrollSentinel
        hasNextPage={hasNextPage ?? false}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
      />
    </div>
  )
}
