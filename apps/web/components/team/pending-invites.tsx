"use client"

import { Button } from "@workspace/ui/components/button"
import { Mail } from "lucide-react"

import { EmptyHint } from "@/components/common/empty-hint"
import { useRevokeInviteMutation } from "@/hooks/use-team"

import type { PendingInviteRow } from "./types"

function relativeExpiry(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return "expired"
  const days = Math.floor(ms / (24 * 60 * 60 * 1000))
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"} left`
  const hours = Math.floor(ms / (60 * 60 * 1000))
  return `${hours} hour${hours === 1 ? "" : "s"} left`
}

export function PendingInvites({ invites }: { invites: PendingInviteRow[] }) {
  const revoke = useRevokeInviteMutation()

  if (invites.length === 0) {
    return (
      <div className="px-4 py-6">
        <EmptyHint
          variant="inline"
          icon={Mail}
          title="No pending invites"
          description="When you invite teammates, they'll appear here until they accept."
        />
      </div>
    )
  }

  return (
    <ul>
      {invites.map((inv, idx) => (
        <li
          key={inv.id}
          className={
            idx < invites.length - 1 ? "border-b border-border-soft" : undefined
          }
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{inv.email}</div>
              <div className="truncate text-xs text-muted-foreground">
                Invited by {inv.invitedBy.name} · {inv.role} · {relativeExpiry(inv.expiresAt)}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => revoke.mutate(inv.id)}
              disabled={revoke.isPending}
            >
              Revoke
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
