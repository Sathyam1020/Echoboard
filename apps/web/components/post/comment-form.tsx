"use client"

import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { useState, useTransition } from "react"

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

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={
          authed
            ? props.mode === "reply"
              ? "Write a reply…"
              : props.mode === "edit"
                ? "Edit your comment…"
                : "Add a comment…"
            : "Sign in to comment"
        }
        disabled={!authed || isPending}
        rows={3}
      />
      {error ? (
        <p className="text-[12px] text-destructive">{error}</p>
      ) : null}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={disabled}>
          {submitLabel}
        </Button>
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
      </div>
    </form>
  )
}
