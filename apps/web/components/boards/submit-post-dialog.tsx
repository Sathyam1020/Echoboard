"use client"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { ApiError, api } from "@/lib/api"

import { IdentityModal } from "./identity-modal"
import { useVisitorIdentity } from "./use-visitor-identity"

export function SubmitPostDialog({
  boardId,
  workspaceId,
  workspaceOwnerId,
}: {
  boardId: string
  workspaceId: string
  workspaceOwnerId: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [identityOpen, setIdentityOpen] = useState(false)

  const identityCtx = useVisitorIdentity({ workspaceId, workspaceOwnerId })

  async function performSubmit() {
    await api.post(`/api/boards/${boardId}/posts`, {
      title: title.trim(),
      description: description.trim(),
    })
    setTitle("")
    setDescription("")
    setOpen(false)
    router.refresh()
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const result = await identityCtx.ensure()
        if (result.kind === "modal") {
          setIdentityOpen(true)
          return
        }
        await performSubmit()
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Something went wrong",
        )
      }
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Submit post</Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit a post</DialogTitle>
            <DialogDescription>
              Share a feature request or idea for the team to review.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="post-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="post-title"
                required
                minLength={3}
                maxLength={140}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's the request?"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="post-description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="post-description"
                required
                minLength={1}
                maxLength={4000}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Context, expected behavior, links…"
              />
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" disabled={isPending} className="mt-1 w-full">
              {isPending ? "Submitting…" : "Submit post"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <IdentityModal
        open={identityOpen}
        onOpenChange={setIdentityOpen}
        workspaceId={workspaceId}
        intent="submit"
        onIdentified={(v) => {
          identityCtx.setIdentity(v)
          // Resume the submit they originally triggered.
          startTransition(async () => {
            try {
              await performSubmit()
            } catch (err) {
              setError(
                err instanceof ApiError ? err.message : "Something went wrong",
              )
            }
          })
        }}
      />
    </>
  )
}
