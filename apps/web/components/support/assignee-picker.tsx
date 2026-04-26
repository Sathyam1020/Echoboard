"use client"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Check, UserPlus } from "lucide-react"

import { useTeamMembersQuery } from "@/hooks/queries/use-team-members"
import { useSetConversationAssigneeMutation } from "@/hooks/use-support-mutations"

import { SupportAvatar } from "./avatar"
import type { SupportConversationRow } from "./types"

// Dropdown over the workspace's members. Picking a member assigns the
// conversation to them; "Unassigned" clears it. Members come from the
// existing /api/team/members cache (already populated by the
// settings/team page when visited; otherwise loaded here).

export function AssigneePicker({
  conversationId,
  workspaceId,
  current,
}: {
  conversationId: string
  workspaceId: string
  current: SupportConversationRow["assignedTo"]
}) {
  const teamQuery = useTeamMembersQuery()
  const assign = useSetConversationAssigneeMutation(
    conversationId,
    workspaceId,
  )

  const members = teamQuery.data?.members ?? []

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          aria-label="Assign conversation"
        >
          {current ? (
            <>
              <SupportAvatar
                name={current.name}
                image={current.image}
                className="size-5"
              />
              <span className="truncate max-w-[120px]">{current.name}</span>
            </>
          ) : (
            <>
              <UserPlus className="size-3.5" aria-hidden />
              <span>Assign</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Assign to
        </DropdownMenuLabel>
        {members.map((m) => {
          const active = current?.id === m.user.id
          return (
            <DropdownMenuItem
              key={m.user.id}
              disabled={assign.isPending}
              onSelect={() =>
                assign.mutate({
                  userId: m.user.id,
                  assignee: {
                    id: m.user.id,
                    name: m.user.name,
                    image: m.user.image,
                  },
                })
              }
              className="flex items-center gap-2"
            >
              <SupportAvatar
                name={m.user.name}
                image={m.user.image}
                className="size-6"
              />
              <span className="truncate text-[13px]">{m.user.name}</span>
              {active ? (
                <Check className="ml-auto size-4 text-muted-foreground" />
              ) : null}
            </DropdownMenuItem>
          )
        })}
        {current ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={assign.isPending}
              onSelect={() =>
                assign.mutate({ userId: null, assignee: null })
              }
              className="text-muted-foreground"
            >
              Unassign
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
