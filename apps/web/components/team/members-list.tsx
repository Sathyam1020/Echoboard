"use client"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { MoreHorizontal, Users } from "lucide-react"

import { EmptyHint } from "@/components/common/empty-hint"
import {
  useChangeMemberRoleMutation,
  useLeaveWorkspaceMutation,
  useRemoveMemberMutation,
} from "@/hooks/use-team"

import type { TeamMemberRow, WorkspaceRole } from "./types"

export function MembersList({
  members,
  currentUserId,
  myRole,
}: {
  members: TeamMemberRow[]
  currentUserId: string
  myRole: WorkspaceRole | null
}) {
  const changeRole = useChangeMemberRoleMutation()
  const remove = useRemoveMemberMutation()
  const leave = useLeaveWorkspaceMutation()

  if (members.length === 0) {
    return (
      <div className="px-4 py-6">
        <EmptyHint
          variant="inline"
          icon={Users}
          title="No team members"
          description="Invite teammates to collaborate."
        />
      </div>
    )
  }

  const canManage = myRole === "owner" || myRole === "admin"

  return (
    <ul>
      {members.map((m, idx) => {
        const isSelf = m.user.id === currentUserId
        const isOwner = m.role === "owner"
        // Admins can manage members (incl. themselves via leave) but not owners.
        const showMenu = isSelf || (canManage && !isOwner)

        return (
          <li
            key={m.membershipId}
            className={
              idx < members.length - 1 ? "border-b border-border-soft" : undefined
            }
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <Avatar
                name={m.user.name}
                image={m.user.image}
                className="size-8"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {m.user.name}
                  {isSelf ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (you)
                    </span>
                  ) : null}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {m.user.email}
                </div>
              </div>
              <RoleBadge role={m.role} />
              {showMenu ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Member actions">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canManage && !isSelf && !isOwner ? (
                      <>
                        {m.role === "member" ? (
                          <DropdownMenuItem
                            onSelect={() =>
                              changeRole.mutate({
                                membershipId: m.membershipId,
                                role: "admin",
                              })
                            }
                          >
                            Promote to admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onSelect={() =>
                              changeRole.mutate({
                                membershipId: m.membershipId,
                                role: "member",
                              })
                            }
                          >
                            Demote to member
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => remove.mutate(m.membershipId)}
                        >
                          Remove from workspace
                        </DropdownMenuItem>
                      </>
                    ) : null}
                    {isSelf && !isOwner ? (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => leave.mutate()}
                      >
                        Leave workspace
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function RoleBadge({ role }: { role: WorkspaceRole }) {
  const label = role === "owner" ? "Owner" : role === "admin" ? "Admin" : "Member"
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
  )
}

function Avatar({
  name,
  image,
  className,
}: {
  name: string
  image: string | null
  className?: string
}) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={image}
        alt=""
        className={`shrink-0 rounded-full object-cover ${className ?? ""}`}
      />
    )
  }
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase()
  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium ${className ?? ""}`}
    >
      {initials || "?"}
    </div>
  )
}
