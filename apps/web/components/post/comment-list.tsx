"use client"

import { MessageSquare } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

import { EmptyHint } from "@/components/common/empty-hint"

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
  workspaceOwnerId,
  initialComments,
}: {
  postId: string
  // workspaceId is optional so the admin dashboard's CommentList still
  // works (admin auth is enough there). When provided, public-board flow
  // gates anonymous comments through the identity modal.
  workspaceId?: string
  workspaceOwnerId: string
  initialComments: CommentRow[]
}) {
  const [comments, setComments] = useState<CommentRow[]>(initialComments)

  const tree = useMemo(() => buildTree(comments), [comments])
  const liveCount = comments.filter((c) => !c.deletedAt).length

  const addComment = useCallback((c: CommentRow) => {
    setComments((prev) => [...prev, c])
  }, [])

  const updateComment = useCallback((c: CommentRow) => {
    setComments((prev) => prev.map((p) => (p.id === c.id ? c : p)))
  }, [])

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
        onSuccess={addComment}
      />

      {tree.length === 0 ? (
        <EmptyHint
          variant="soft"
          icon={MessageSquare}
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
              workspaceOwnerId={workspaceOwnerId}
              onAdd={addComment}
              onUpdate={updateComment}
            />
          ))}
        </div>
      )}
    </section>
  )
}
