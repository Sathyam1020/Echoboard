"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { useState, useTransition } from "react"

import { api, ApiError } from "@/lib/api"
import { authClient } from "@/lib/auth-client"
import { renderLinkifiedText } from "@/lib/linkify"
import { formatRelativeTime } from "@/lib/relative-time"

import { Avatar } from "../boards/avatar"
import type { CommentRow } from "../boards/types"

import { CommentForm } from "./comment-form"

export type CommentNode = CommentRow & {
  children: CommentNode[]
}

type Props = {
  node: CommentNode
  depth: number
  postId: string
  workspaceOwnerId: string
  onAdd: (c: CommentRow) => void
  onUpdate: (c: CommentRow) => void
}

function countDescendants(node: CommentNode): number {
  let n = node.children.length
  for (const child of node.children) n += countDescendants(child)
  return n
}

export function CommentItem({
  node,
  depth,
  postId,
  workspaceOwnerId,
  onAdd,
  onUpdate,
}: Props) {
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id ?? null
  const isTombstoned = Boolean(node.deletedAt)

  const canMutate =
    !isTombstoned &&
    !!userId &&
    (userId === node.author?.id || userId === workspaceOwnerId)

  const [collapsed, setCollapsed] = useState(false)
  const [replying, setReplying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deletePending, startDelete] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const hasChildren = node.children.length > 0
  const hiddenCount = collapsed ? countDescendants(node) : 0

  function onDelete() {
    if (!canMutate || deletePending) return
    startDelete(async () => {
      try {
        setDeleteError(null)
        const res = await api.delete<{ comment: CommentRow }>(
          `/api/comments/${node.id}`,
        )
        onUpdate(res.comment)
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Something went wrong"
        setDeleteError(message)
      }
    })
  }

  return (
    <div className="flex gap-3">
      <div className="flex shrink-0 flex-col items-center">
        <Avatar name={node.author?.name ?? "Deleted"} size={32} />
        {hasChildren && !collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse thread"
            className="group flex w-8 flex-1 cursor-pointer justify-center py-1.5"
          >
            <div className="h-full w-px bg-border transition-colors group-hover:bg-foreground" />
          </button>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="font-medium text-foreground">
            {node.author?.name ?? "Deleted user"}
          </span>
          {node.author?.role === "owner" ? (
            <span className="status-badge status-shipped !text-[10px]">
              TEAM
            </span>
          ) : null}
          <span
            className="font-mono tabular-nums text-muted-foreground"
            title={new Date(node.createdAt).toLocaleString()}
          >
            {formatRelativeTime(node.createdAt)}
          </span>
          {node.editedAt && !isTombstoned ? (
            <span className="text-muted-foreground">(edited)</span>
          ) : null}
          {collapsed && hasChildren ? (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Expand thread"
            >
              + {hiddenCount} hidden
            </button>
          ) : null}
        </div>

        {!collapsed ? (
          <>
            {editing ? (
              <CommentForm
                mode="edit"
                postId={postId}
                commentId={node.id}
                initialBody={node.body}
                onSuccess={(c) => {
                  setEditing(false)
                  onUpdate(c)
                }}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <p
                className={cn(
                  "whitespace-pre-wrap break-words text-[13px] leading-relaxed",
                  isTombstoned && "italic text-muted-foreground",
                )}
              >
                {isTombstoned ? node.body : renderLinkifiedText(node.body)}
              </p>
            )}

            {!isTombstoned && !editing ? (
              <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
                {userId ? (
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => setReplying((r) => !r)}
                  >
                    Reply
                  </Button>
                ) : null}
                {canMutate ? (
                  <>
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={() => setEditing(true)}
                    >
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          disabled={deletePending}
                        >
                          {deletePending ? "Deleting…" : "Delete"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Your comment will be replaced with{" "}
                            <span className="font-medium">[deleted]</span>.
                            Replies under it stay visible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={onDelete}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : null}
              </div>
            ) : null}

            {deleteError ? (
              <p className="text-[12px] text-destructive">{deleteError}</p>
            ) : null}

            {replying && !isTombstoned ? (
              <div className="mt-1">
                <CommentForm
                  mode="reply"
                  postId={postId}
                  parentId={node.id}
                  onSuccess={(c) => {
                    setReplying(false)
                    onAdd(c)
                  }}
                  onCancel={() => setReplying(false)}
                />
              </div>
            ) : null}

            {hasChildren ? (
              <div className="mt-2 flex flex-col gap-3">
                {node.children.map((child) => (
                  <CommentItem
                    key={child.id}
                    node={child}
                    depth={depth + 1}
                    postId={postId}
                    workspaceOwnerId={workspaceOwnerId}
                    onAdd={onAdd}
                    onUpdate={onUpdate}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
