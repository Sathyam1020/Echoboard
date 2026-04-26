"use client"

import { Button } from "@workspace/ui/components/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { useAcceptInviteMutation } from "@/hooks/use-team"
import { ApiError } from "@/lib/http/api-error"

import type { WorkspaceRole } from "./types"

type Invite = {
  id: string
  email: string
  role: WorkspaceRole
  workspace: { id: string; name: string; slug: string }
  inviter: { name: string }
  expiresAt: string
}

export function AcceptInviteCard({
  token,
  invite,
  currentEmail,
}: {
  token: string
  invite: Invite
  currentEmail: string
}) {
  const router = useRouter()
  const accept = useAcceptInviteMutation()
  const [error, setError] = useState<string | null>(null)

  const emailMismatch =
    invite.email.toLowerCase() !== currentEmail.toLowerCase()

  function onAccept() {
    setError(null)
    accept.mutate(token, {
      onSuccess: () => {
        toast.success(`Joined ${invite.workspace.name}`)
        router.push("/dashboard")
      },
      onError: (err) =>
        setError(err instanceof ApiError ? err.message : "Couldn't accept invite"),
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h1 className="text-lg font-medium">
        Join {invite.workspace.name}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {invite.inviter.name} invited you to join{" "}
        <span className="text-foreground">{invite.workspace.name}</span> as a{" "}
        <span className="text-foreground">{invite.role}</span>.
      </p>

      {emailMismatch ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-900">
          This invite was sent to <strong>{invite.email}</strong>, but you're
          signed in as <strong>{currentEmail}</strong>. Sign in with the invited
          email and try again.
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-[13px] text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Cancel
        </Button>
        <Button onClick={onAccept} disabled={emailMismatch || accept.isPending}>
          {accept.isPending ? "Joining…" : "Accept invite"}
        </Button>
      </div>
    </div>
  )
}
