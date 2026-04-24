"use client"

import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useTransition } from "react"

import { Avatar } from "@/components/boards/avatar"
import { api, ApiError } from "@/lib/api"
import { authClient } from "@/lib/auth-client"

import type { CommentRow } from "../boards/types"

type TopProps = {
  mode: "top"
  postId: string
  onSuccess: (comment: CommentRow) => void
}

type ReplyProps = {
  mode: "reply"
  postId: string
  parentId: string
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
  const pathname = usePathname()
  const signinHref = `/signin?redirectTo=${encodeURIComponent(pathname)}`

  const initial = props.mode === "edit" ? props.initialBody : ""
  const [body, setBody] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const disabled = !authed || isPending || body.trim().length === 0

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (disabled) return
    const text = body.trim()

    startTransition(async () => {
      try {
        setError(null)
        if (props.mode === "edit") {
          const res = await api.patch<{ comment: CommentRow }>(
            `/api/comments/${props.commentId}`,
            { body: text },
          )
          props.onSuccess(res.comment)
        } else if (props.mode === "reply") {
          const res = await api.post<{ comment: CommentRow }>(
            `/api/posts/${props.postId}/comments`,
            { body: text, parentId: props.parentId },
          )
          props.onSuccess(res.comment)
          setBody("")
        } else {
          const res = await api.post<{ comment: CommentRow }>(
            `/api/posts/${props.postId}/comments`,
            { body: text },
          )
          props.onSuccess(res.comment)
          setBody("")
        }
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

  // Signed-out composer on the top-level form: invite sign-in instead of
  // showing a disabled textarea. Inline forms (reply/edit) never reach this
  // branch because they only render for authed users.
  if (!authed && props.mode === "top") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-card px-4 py-5">
        <p className="text-[13px] text-muted-foreground">
          Sign in to join the conversation.
        </p>
        <Button asChild size="sm">
          <Link href={signinHref}>Sign in</Link>
        </Button>
      </div>
    )
  }

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
        {isTop && authorName ? (
          <div className="pt-0.5">
            <Avatar name={authorName} size={32} />
          </div>
        ) : null}
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder}
          disabled={!authed || isPending}
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
    </form>
  )
}
