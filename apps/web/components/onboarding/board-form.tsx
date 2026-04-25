"use client"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { useCreateBoardMutation } from "@/hooks/use-boards"
import { ApiError } from "@/lib/http/api-error"

import { VisibilityRadio } from "./visibility-radio"

function toSlug(input: string): string {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
  return s.length >= 2 ? s : "feature-requests"
}

export function BoardForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter()
  const [name, setName] = useState("Feature Requests")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const mutation = useCreateBoardMutation()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await mutation.mutateAsync({
          workspaceId,
          name: name.trim(),
          slug: toSlug(name),
          visibility: "public",
        })
        router.push("/dashboard")
        router.refresh()
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Something went wrong",
        )
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="board-name">
          Board name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="board-name"
          required
          minLength={1}
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Visibility</Label>
        <VisibilityRadio />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending ? (
          "Creating…"
        ) : (
          <>
            Create board
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  )
}
