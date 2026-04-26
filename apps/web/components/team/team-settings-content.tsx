"use client"

import { SectionCard } from "@/components/app-shell/section-card"
import { useTeamInvitesQuery } from "@/hooks/queries/use-invites"
import { useTeamMembersQuery } from "@/hooks/queries/use-team-members"
import { authClient } from "@/lib/auth-client"

import { InviteForm } from "./invite-form"
import { MembersList } from "./members-list"
import { PendingInvites } from "./pending-invites"

// Team management — rendered inside the settings shell as a tab next to
// "Widget". Reads members + pending invites from the cache (SSR
// prefetched). The `canManage` prop is set server-side based on whether
// the /api/team/invites prefetch succeeded — admins-only get the invite UI.
export function TeamSettingsContent({ canManage }: { canManage: boolean }) {
  const membersQuery = useTeamMembersQuery()
  const invitesQuery = useTeamInvitesQuery()
  const { data: session } = authClient.useSession()

  if (!session) return null

  const members = membersQuery.data?.members ?? []
  const invites = invitesQuery.data?.invites ?? []

  // Owner of the current workspace can change roles + remove members;
  // admins can do the same EXCEPT they can't touch other owners.
  const myMembership = members.find((m) => m.user.id === session.user.id)
  const myRole = myMembership?.role ?? null

  return (
    <div className="flex flex-col gap-5">
      {canManage ? (
        <SectionCard title="Invite a teammate">
          <InviteForm />
        </SectionCard>
      ) : null}

      <SectionCard title="Members" flush>
        <MembersList
          members={members}
          currentUserId={session.user.id}
          myRole={myRole}
        />
      </SectionCard>

      {canManage ? (
        <SectionCard title="Pending invites" flush>
          <PendingInvites invites={invites} />
        </SectionCard>
      ) : null}
    </div>
  )
}
