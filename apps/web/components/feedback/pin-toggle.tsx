"use client"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Pin, PinOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { usePinPostMutation } from "@/hooks/use-posts"
import { ApiError } from "@/lib/http/api-error"

export function PinToggle({
  postId,
  initialPinned,
}: {
  postId: string
  initialPinned: boolean
}) {
  const router = useRouter()
  const [pinned, setPinned] = useState(initialPinned)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const mutation = usePinPostMutation(postId)

  function onToggle() {
    if (isPending) return
    const prev = pinned
    const next = !prev
    setPinned(next)
    setError(null)
    startTransition(async () => {
      try {
        await mutation.mutateAsync(next)
        router.refresh()
      } catch (err) {
        setPinned(prev)
        setError(
          err instanceof ApiError ? err.message : "Failed to update pin",
        )
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onToggle}
        disabled={isPending}
        title={pinned ? "Unpin post" : "Pin post"}
        className={cn("gap-1.5", pinned && "text-primary")}
      >
        {pinned ? (
          <PinOff className="size-3.5" aria-hidden />
        ) : (
          <Pin className="size-3.5" aria-hidden />
        )}
        {pinned ? "Unpin" : "Pin"}
      </Button>
      {error ? (
        <span className="text-[11px] text-destructive">{error}</span>
      ) : null}
    </div>
  )
}
