"use client"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { ArrowRight, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { useCreateWorkspaceMutation } from "@/hooks/use-workspaces"
import { ApiError } from "@/lib/http/api-error"

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
}

export function WorkspaceForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const mutation = useCreateWorkspaceMutation()

  function onNameChange(value: string) {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  function onSlugChange(value: string) {
    setSlugTouched(true)
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await mutation.mutateAsync({
          name: name.trim(),
          slug: slug.trim(),
        })
        router.push("/onboarding/board")
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
        <Label htmlFor="ws-name">
          Workspace name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="ws-name"
          placeholder="Acme Corp"
          required
          maxLength={80}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ws-slug">Your board URL</Label>
        <div className="flex overflow-hidden rounded-lg border border-border">
          <Input
            id="ws-slug"
            className="rounded-none border-0 text-right font-mono tabular-nums focus-visible:ring-0"
            placeholder="acme"
            required
            minLength={2}
            maxLength={40}
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
          />
          <div className="flex items-center border-l border-border bg-secondary px-3 font-mono text-sm text-muted-foreground">
            .echoboard.io
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          You can change this later.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Logo</Label>
        <div
          aria-disabled
          className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border bg-secondary/50 p-6 text-center opacity-60"
        >
          <Upload
            className="size-5 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm font-medium">Drag &amp; drop a PNG or SVG</p>
          <p className="text-xs text-muted-foreground">Coming soon</p>
        </div>
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
            Create workspace
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  )
}
