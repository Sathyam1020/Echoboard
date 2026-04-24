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
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { ApiError, api } from "@/lib/api"

export function NewPostDialog({ boardId }: { boardId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const res = await api.post<{ post: { id: string } }>(
          `/api/boards/${boardId}/posts`,
          { title: title.trim(), description: description.trim() },
        )
        setTitle("")
        setDescription("")
        setOpen(false)
        // Land admin on the post they just created — feels better than a list refresh.
        router.push(`/dashboard/feedback/${res.post.id}`)
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Something went wrong",
        )
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-3.5" aria-hidden />
          New post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New post</DialogTitle>
          <DialogDescription>
            Add feedback to the board on behalf of your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-post-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="new-post-title"
              required
              minLength={3}
              maxLength={140}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the request?"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-post-description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="new-post-description"
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
            {isPending ? "Creating…" : "Create post"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
