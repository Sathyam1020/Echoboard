"use client"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { ApiError, api } from "@/lib/api"

export function EditPostDialog({
  postId,
  initialTitle,
  initialDescription,
}: {
  postId: string
  initialTitle: string
  initialDescription: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onOpenChange(next: boolean) {
    if (next) {
      setTitle(initialTitle)
      setDescription(initialDescription)
      setError(null)
    }
    setOpen(next)
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const trimmedTitle = title.trim()
    const trimmedDesc = description.trim()
    if (
      trimmedTitle === initialTitle.trim() &&
      trimmedDesc === initialDescription.trim()
    ) {
      setOpen(false)
      return
    }
    startTransition(async () => {
      try {
        await api.patch(`/api/posts/${postId}`, {
          title: trimmedTitle,
          description: trimmedDesc,
        })
        setOpen(false)
        router.refresh()
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Something went wrong",
        )
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="ghost" className="gap-1.5">
          <Pencil className="size-3.5" aria-hidden />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit post</DialogTitle>
          <DialogDescription>Update the title or description.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              required
              minLength={3}
              maxLength={140}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              required
              minLength={1}
              maxLength={4000}
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
