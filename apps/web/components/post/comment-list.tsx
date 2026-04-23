"use client"

import { useCallback, useMemo, useState } from "react"

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
  workspaceOwnerId,
  initialComments,
}: {
  postId: string
  workspaceOwnerId: string
  initialComments: CommentRow[]
}) {
  const [comments, setComments] = useState<CommentRow[]>(initialComments)

  const tree = useMemo(() => buildTree(comments), [comments])

  const addComment = useCallback((c: CommentRow) => {
    setComments((prev) => [...prev, c])
  }, [])

  const updateComment = useCallback((c: CommentRow) => {
    setComments((prev) => prev.map((p) => (p.id === c.id ? c : p)))
  }, [])

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="mb-3 text-sm font-medium">
          Comments
          <span className="ml-2 font-mono tabular-nums text-muted-foreground">
            {comments.filter((c) => !c.deletedAt).length}
          </span>
        </h2>
        <CommentForm mode="top" postId={postId} onSuccess={addComment} />
      </div>

      {tree.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {tree.map((node) => (
            <CommentItem
              key={node.id}
              node={node}
              depth={0}
              postId={postId}
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
