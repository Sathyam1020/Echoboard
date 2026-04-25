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

import { useDeleteCommentMutation } from "@/hooks/use-comments"
import { ApiError } from "@/lib/http/api-error"
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
  workspaceId?: string
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
  workspaceId,
  workspaceOwnerId,
  onAdd,
  onUpdate,
}: Props) {
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id ?? null
  const isTombstoned = Boolean(node.deletedAt)
  const isOwner = node.author?.role === "owner"

  const canMutate =
    !isTombstoned &&
    !!userId &&
    (userId === node.author?.id || userId === workspaceOwnerId)

  const [collapsed, setCollapsed] = useState(false)
  const [replying, setReplying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deletePending, startDelete] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const deleteMutation = useDeleteCommentMutation(postId)

  const hasChildren = node.children.length > 0
  const hiddenCount = collapsed ? countDescendants(node) : 0

  function onDelete() {
    if (!canMutate || deletePending) return
    startDelete(async () => {
      try {
        setDeleteError(null)
        const res = await deleteMutation.mutateAsync(node.id)
        onUpdate(res.comment)
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Something went wrong"
        setDeleteError(message)
      }
    })
  }

  // Top-level comments get the card wrapper for clear visual anchoring.
  // Nested replies flow inside their parent card connected by the thread
  // bar — so depth > 0 drops the card shell.
  const wrapInCard = depth === 0
  const contentClasses = cn(
    "group/comment flex gap-3",
    wrapInCard && "rounded-xl border border-border bg-card p-4 sm:p-5",
  )

  return (
    <article className={contentClasses}>
      <div className="shrink-0 pt-0.5">
        <Avatar name={node.author?.name ?? "Deleted"} size={32} />
      </div>

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[13.5px] font-medium text-foreground">
            {node.author?.name ?? "Deleted user"}
          </span>
          {isOwner ? (
            <span className="inline-flex items-center rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-primary-foreground">
              TEAM
            </span>
          ) : null}
          <span
            className="font-mono text-[11.5px] text-muted-foreground tabular-nums"
            title={new Date(node.createdAt).toLocaleString()}
          >
            · {formatRelativeTime(node.createdAt)}
          </span>
          {node.editedAt && !isTombstoned ? (
            <span className="text-[11px] text-muted-foreground/80">
              (edited)
            </span>
          ) : null}
        </header>

        {editing ? (
          <div className="mt-2.5">
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
          </div>
        ) : (
          <p
            className={cn(
              "mt-2 break-words whitespace-pre-wrap text-[14px] leading-[1.6] text-foreground/90",
              isTombstoned && "text-muted-foreground italic",
            )}
          >
            {isTombstoned ? node.body : renderLinkifiedText(node.body)}
          </p>
        )}

        {deleteError ? (
          <p className="mt-1.5 text-[12px] text-destructive">{deleteError}</p>
        ) : null}

        {!isTombstoned && !editing ? (
          <div className="mt-2.5 -ml-2 flex items-center gap-0.5 text-muted-foreground transition-opacity group-hover/comment:text-foreground/80">
            {userId ? (
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={() => setReplying((r) => !r)}
                className="h-7 px-2 text-[12px] font-normal hover:text-foreground"
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
                  className="h-7 px-2 text-[12px] font-normal hover:text-foreground"
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
                      className="h-7 px-2 text-[12px] font-normal hover:text-destructive"
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
            {hasChildren ? (
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={() => setCollapsed((c) => !c)}
                className="h-7 px-2 text-[12px] font-normal hover:text-foreground"
              >
                {collapsed
                  ? `Show ${hiddenCount} ${hiddenCount === 1 ? "reply" : "replies"}`
                  : "Collapse"}
              </Button>
            ) : null}
          </div>
        ) : null}

        {replying && !isTombstoned ? (
          <div className="mt-3">
            <CommentForm
              mode="reply"
              postId={postId}
              parentId={node.id}
              identity={
                workspaceId
                  ? { workspaceId, workspaceOwnerId }
                  : undefined
              }
              onSuccess={(c) => {
                setReplying(false)
                onAdd(c)
              }}
              onCancel={() => setReplying(false)}
            />
          </div>
        ) : null}

        {hasChildren && !collapsed ? (
          <div className="mt-4 flex gap-4">
            <button
              type="button"
              aria-label="Collapse thread"
              onClick={() => setCollapsed(true)}
              className="w-[2px] shrink-0 cursor-pointer rounded-full bg-border transition-colors hover:bg-foreground/50 focus-visible:bg-foreground/50 focus-visible:outline-none"
            />
            <div className="min-w-0 flex-1 space-y-5">
              {node.children.map((child) => (
                <CommentItem
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  postId={postId}
                  workspaceId={workspaceId}
                  workspaceOwnerId={workspaceOwnerId}
                  onAdd={onAdd}
                  onUpdate={onUpdate}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  )
}
