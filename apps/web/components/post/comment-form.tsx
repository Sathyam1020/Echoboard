"use client"

import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { useState, useTransition } from "react"

import { Avatar } from "@/components/boards/avatar"
import { IdentityModal } from "@/components/boards/identity-modal"
import { useVisitorIdentity } from "@/components/boards/use-visitor-identity"
import {
  useCreateCommentMutation,
  useUpdateCommentMutation,
} from "@/hooks/use-comments"
import { ApiError } from "@/lib/http/api-error"
import { authClient } from "@/lib/auth-client"
import type { VisitorIdentity } from "@/lib/visitor-client"

import type { CommentRow } from "../boards/types"

type IdentityCtx = {
  workspaceId: string
  workspaceOwnerId: string
}

type TopProps = {
  mode: "top"
  postId: string
  identity?: IdentityCtx
  onSuccess: (comment: CommentRow) => void
}

type ReplyProps = {
  mode: "reply"
  postId: string
  parentId: string
  identity?: IdentityCtx
  onSuccess: (comment: CommentRow) => void
  onCancel: () => void
}

type EditProps = {
  mode: "edit"
  postId: string
  commentId: string
  initialBody: string
  onSuccess: (comment: CommentRow) => void
  onCancel: () => void
}

type Props = TopProps | ReplyProps | EditProps

export function CommentForm(props: Props) {
  const { data: session } = authClient.useSession()
  const authed = Boolean(session)
  const authorName = session?.user?.name ?? null
  // Identity context only relevant for top + reply on public surfaces. Edit
  // never gates on visitor identity (the comment already exists with an owner).
  const identityCtx =
    "identity" in props ? props.identity : undefined

  // Always call the hook (rules of hooks) — pass empty workspace ids when
  // identity context isn't supplied; the hook just sits idle in that case.
  const visitorIdentity = useVisitorIdentity({
    workspaceId: identityCtx?.workspaceId ?? "",
    workspaceOwnerId: identityCtx?.workspaceOwnerId ?? "",
  })

  const initial = props.mode === "edit" ? props.initialBody : ""
  const [body, setBody] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [identityModalOpen, setIdentityModalOpen] = useState(false)

  // Always call both hooks (rules of hooks). The mutation that doesn't
  // apply to the current mode just sits idle.
  const createMutation = useCreateCommentMutation(props.postId)
  const updateMutation = useUpdateCommentMutation(props.postId)

  const empty = body.trim().length === 0
  // Edit mode requires the existing user/visitor identity — no email prompt.
  // Top + reply on a visitor-aware surface allow guests; otherwise require
  // an admin session (e.g. dashboard pages without identity ctx).
  const disabled =
    isPending ||
    empty ||
    (props.mode === "edit" ? !authed : !identityCtx && !authed)

  async function performWrite(): Promise<void> {
    const text = body.trim()
    if (props.mode === "edit") {
      const res = await updateMutation.mutateAsync({
        commentId: props.commentId,
        body: text,
      })
      props.onSuccess(res.comment)
      return
    }
    if (props.mode === "reply") {
      const res = await createMutation.mutateAsync({
        body: text,
        parentId: props.parentId,
      })
      props.onSuccess(res.comment)
      setBody("")
      return
    }
    const res = await createMutation.mutateAsync({ body: text })
    props.onSuccess(res.comment)
    setBody("")
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (disabled) return

    startTransition(async () => {
      try {
        setError(null)
        // Public surfaces (identity ctx supplied): gate via visitor identity.
        if (identityCtx && props.mode !== "edit") {
          const result = await visitorIdentity.ensure()
          if (result.kind === "modal") {
            setIdentityModalOpen(true)
            return
          }
        }
        await performWrite()
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Something went wrong"
        setError(message)
      }
    })
  }

  const submitLabel =
    props.mode === "edit"
      ? isPending
        ? "Saving…"
        : "Save"
      : isPending
        ? "Posting…"
        : props.mode === "reply"
          ? "Reply"
          : "Comment"

  const placeholder =
    props.mode === "reply"
      ? "Write a reply…"
      : props.mode === "edit"
        ? "Edit your comment…"
        : "Share your thoughts…"

  // Top-level composer gets the full card treatment. Reply/edit forms are
  // compact inline forms rendered inside an existing comment.
  const isTop = props.mode === "top"

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex flex-col gap-3",
        isTop && "rounded-xl border border-border bg-card p-4",
      )}
    >
      <div className={cn("flex gap-3", !isTop && "items-start")}>
        {isTop && (authorName || visitorIdentity.visitor?.name) ? (
          <div className="pt-0.5">
            <Avatar
              name={
                authorName ?? visitorIdentity.visitor?.name ?? "Guest"
              }
              size={32}
            />
          </div>
        ) : null}
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder}
          disabled={
            isPending ||
            (props.mode === "edit" && !authed)
          }
          rows={isTop ? 3 : 2}
          className={cn(
            isTop
              ? "resize-none border-0 bg-transparent p-0 text-[14px] leading-relaxed shadow-none focus-visible:border-0 focus-visible:ring-0"
              : "min-h-[72px] text-[13.5px] leading-relaxed",
          )}
        />
      </div>
      {error ? (
        <p className="text-[12px] text-destructive">{error}</p>
      ) : null}
      <div
        className={cn(
          "flex items-center justify-end gap-2",
          isTop && "border-t border-border-soft pt-3",
        )}
      >
        {props.mode !== "top" ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={props.onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={disabled}>
          {submitLabel}
        </Button>
      </div>
      {identityCtx && props.mode !== "edit" ? (
        <IdentityModal
          open={identityModalOpen}
          onOpenChange={setIdentityModalOpen}
          workspaceId={identityCtx.workspaceId}
          intent="comment"
          onIdentified={(v: VisitorIdentity) => {
            visitorIdentity.setIdentity(v)
            startTransition(async () => {
              try {
                await performWrite()
              } catch (err) {
                setError(
                  err instanceof ApiError
                    ? err.message
                    : "Something went wrong",
                )
              }
            })
          }}
        />
      ) : null}
    </form>
  )
}
