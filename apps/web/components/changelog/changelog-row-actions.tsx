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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { ApiError, api } from "@/lib/api"

export function ChangelogRowActions({
  entryId,
  published,
}: {
  entryId: string
  published: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function togglePublish() {
    if (isPending) return
    setError(null)
    startTransition(async () => {
      try {
        await api.patch(`/api/changelog/${entryId}/publish`, {
          published: !published,
        })
        router.refresh()
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Failed to update status",
        )
      }
    })
  }

  function onDelete() {
    if (isPending) return
    setError(null)
    startTransition(async () => {
      try {
        await api.delete(`/api/changelog/${entryId}`)
        setConfirmOpen(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to delete")
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 text-muted-foreground"
            aria-label="Entry actions"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/changelog/${entryId}/edit`}>Edit</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={togglePublish} disabled={isPending}>
            {published ? "Unpublish" : "Publish"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              setConfirmOpen(true)
            }}
            className="text-destructive focus:text-destructive"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error ? (
        <span className="ml-2 text-[11px] text-destructive">{error}</span>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogTrigger asChild>
          <span className="sr-only" aria-hidden />
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Linked post references will be removed
              from the changelog but the posts themselves stay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault()
                onDelete()
              }}
            >
              {isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
