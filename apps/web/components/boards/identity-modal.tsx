"use client"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { useState, useTransition } from "react"

import { ApiError } from "@/lib/http/api-error"
import { signInAsGuest, type VisitorIdentity } from "@/lib/visitor-client"

export function IdentityModal({
  open,
  onOpenChange,
  workspaceId,
  onIdentified,
  intent = "vote",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  onIdentified: (visitor: VisitorIdentity) => void
  intent?: "vote" | "comment" | "submit"
}) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const headline =
    intent === "vote"
      ? "One quick step before you vote"
      : intent === "comment"
        ? "Share your name to comment"
        : "Tell us who you are"
  const description =
    "Just an email so we can show your votes back to you and notify you when the team replies. No account needed."

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const visitor = await signInAsGuest({
          workspaceId,
          email: email.trim(),
          name: name.trim() || undefined,
        })
        onIdentified(visitor)
        onOpenChange(false)
        setEmail("")
        setName("")
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Something went wrong",
        )
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{headline}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="visitor-email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="visitor-email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="visitor-name">Name</Label>
            <Input
              id="visitor-name"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Cooper"
            />
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Continuing…" : "Continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
