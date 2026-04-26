"use client"

import { MessageSquare } from "lucide-react"
import { useMemo } from "react"

import { PostList } from "@/components/boards/post-list"
import type { PostRow } from "@/components/boards/types"
import { EmptyHint } from "@/components/common/empty-hint"
import { InfiniteScrollSentinel } from "@/components/common/infinite-scroll-sentinel"
import { useProfileFeedbackInfiniteQuery } from "@/hooks/queries/use-profile"

// Feedback tab content. Reuses `PostCard` via `PostList` — the rows
// already render the source-board badge when `post.board` is set,
// which the backend includes for profile feedback.
export function ProfileFeedbackList({
  workspaceSlug,
  workspaceId,
  workspaceOwnerId,
  actorId,
}: {
  workspaceSlug: string
  workspaceId: string
  workspaceOwnerId: string
  actorId: string
}) {
  const query = useProfileFeedbackInfiniteQuery({ workspaceSlug, actorId })
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query

  const posts: PostRow[] = useMemo(
    () => query.data?.pages.flatMap((p) => p.posts) ?? [],
    [query.data],
  )

  if (posts.length === 0 && !query.isLoading) {
    return (
      <EmptyHint
        variant="soft"
        icon={MessageSquare}
        title="No feedback yet"
        description="When this person submits a feature request, it lands here."
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
