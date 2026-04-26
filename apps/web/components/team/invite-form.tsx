"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { useState } from "react"

import { useCreateInviteMutation } from "@/hooks/use-team"

export function InviteForm() {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"admin" | "member">("member")
  const invite = useCreateInviteMutation()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    invite.mutate(
      { email: email.trim(), role },
      {
        onSuccess: () => {
          setEmail("")
          setRole("member")
        },
      },
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor="invite-email" className="text-[12px] text-muted-foreground">
          Email
        </Label>
        <Input
          id="invite-email"
          type="email"
          placeholder="teammate@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="w-full sm:w-40">
        <Label htmlFor="invite-role" className="text-[12px] text-muted-foreground">
          Role
        </Label>
        <Select value={role} onValueChange={(v) => setRole(v as "admin" | "member")}>
          <SelectTrigger id="invite-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={invite.isPending}>
        {invite.isPending ? "Sending…" : "Send invite"}
      </Button>
    </form>
  )
}
