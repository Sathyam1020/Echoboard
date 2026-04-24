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
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { ApiError, api } from "@/lib/api"

export function DeletePostDialog({ postId }: { postId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function onConfirm() {
    if (isPending) return
    setError(null)
    startTransition(async () => {
      try {
        await api.delete(`/api/posts/${postId}`)
        setOpen(false)
        router.push("/dashboard/feedback")
        router.refresh()
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Something went wrong",
        )
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="gap-1.5 text-destructive hover:text-destructive"
        >
          <Trash2 className="size-3.5" aria-hidden />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this post?</AlertDialogTitle>
          <AlertDialogDescription>
            All votes and comments will be permanently removed. This cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p className="text-[12px] text-destructive">{error}</p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isPending}
          >
            {isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
