"use client"

import { MessageSquareDashed } from "lucide-react"
import { useMemo } from "react"

import { EmptyHint } from "@/components/common/empty-hint"
import { InfiniteScrollSentinel } from "@/components/common/infinite-scroll-sentinel"
import { CommentSkeletonList } from "@/components/skeletons/comment-skeleton"
import { usePostCommentsInfiniteQuery } from "@/hooks/queries/use-post-comments"

import type { CommentRow } from "../boards/types"

import { CommentForm } from "./comment-form"
import { CommentItem, type CommentNode } from "./comment-item"

function buildTree(rows: CommentRow[]): CommentNode[] {
  const map = new Map<string, CommentNode>()
  for (const r of rows) {
    map.set(r.id, { ...r, children: [] })
  }
  const roots: CommentNode[] = []
  for (const r of rows) {
    const node = map.get(r.id)
    if (!node) continue
    if (r.parentId) {
      const parent = map.get(r.parentId)
      if (parent) {
        parent.children.push(node)
        continue
      }
    }
    roots.push(node)
  }
  return roots
}

export function CommentList({
  postId,
  workspaceId,
  workspaceSlug,
  workspaceOwnerId,
}: {
  postId: string
  // workspaceId is optional so the admin dashboard's CommentList still
  // works (admin auth is enough there). When provided, public-board flow
  // gates anonymous comments through the identity modal.
  workspaceId?: string
  /** Required for `<ActorLink>` to build profile URLs from comment
   *  rows. Optional only because admin paths that don't have it in
   *  scope can omit it — the link falls back to plain text. */
  workspaceSlug?: string
  workspaceOwnerId: string
}) {
  // Cache is fed by SSR (first page) + paginated fetches as the user
  // scrolls. Mutations (create/edit/delete) patch the cache directly,
  // so callbacks below are inert — left as a no-op in case child
  // components ever rely on them again.
  const query = usePostCommentsInfiniteQuery(postId)
  const comments: CommentRow[] = useMemo(
    () => query.data?.pages.flatMap((p) => p.comments) ?? [],
    [query.data],
  )

  const tree = useMemo(() => buildTree(comments), [comments])
  const liveCount = comments.filter((c) => !c.deletedAt).length

  const noop = (_c: CommentRow) => {}

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-medium -tracking-[0.01em]">
          Comments
          <span className="ml-2 font-mono text-[14px] tabular-nums text-muted-foreground">
            {liveCount}
          </span>
        </h2>
      </header>

      <CommentForm
        mode="top"
        postId={postId}
        identity={
          workspaceId
            ? { workspaceId, workspaceOwnerId }
            : undefined
        }
        onSuccess={noop}
      />

      {query.isPending && !query.data ? (
        <CommentSkeletonList />
      ) : tree.length === 0 ? (
        <EmptyHint
          variant="soft"
          icon={MessageSquareDashed}
          title="No comments yet"
          description="Be the first to share your thoughts."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {tree.map((node) => (
            <CommentItem
              key={node.id}
              node={node}
              depth={0}
              postId={postId}
              workspaceId={workspaceId}
              workspaceSlug={workspaceSlug}
              workspaceOwnerId={workspaceOwnerId}
              onAdd={noop}
              onUpdate={noop}
            />
          ))}
        </div>
      )}

      <InfiniteScrollSentinel
        hasNextPage={query.hasNextPage ?? false}
        isFetchingNextPage={query.isFetchingNextPage}
        onLoadMore={() => query.fetchNextPage()}
        endLabel=""
      />
    </section>
  )
}
