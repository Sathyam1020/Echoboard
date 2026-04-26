import { httpClient } from "@/lib/http/axios-client"

import type { PendingInviteRow, TeamMemberRow, WorkspaceRole } from "@/components/team/types"

export type TeamMembersResponse = { members: TeamMemberRow[] }
export type TeamInvitesResponse = { invites: PendingInviteRow[] }

export type InvitePreview = {
  invite: {
    id: string
    email: string
    role: WorkspaceRole
    workspace: { id: string; name: string; slug: string }
    inviter: { name: string }
    expiresAt: string
  }
}

export async function fetchTeamMembers(): Promise<TeamMembersResponse> {
  const { data } = await httpClient.get<TeamMembersResponse>("/api/team/members")
  return data
}

export async function fetchTeamInvites(): Promise<TeamInvitesResponse> {
  const { data } = await httpClient.get<TeamInvitesResponse>("/api/team/invites")
  return data
}

export async function createInvite(body: {
  email: string
  role: "admin" | "member"
}): Promise<{ invite: PendingInviteRow }> {
  const { data } = await httpClient.post<{ invite: PendingInviteRow }>(
    "/api/team/invites",
    body,
  )
  return data
}

export async function revokeInvite(id: string): Promise<void> {
  await httpClient.post(`/api/team/invites/${id}/revoke`, {})
}

export async function previewInvite(token: string): Promise<InvitePreview> {
  const { data } = await httpClient.get<InvitePreview>("/api/team/invites/preview", {
    params: { token },
  })
  return data
}

export async function acceptInvite(
  token: string,
): Promise<{ workspace: { id: string; slug: string; name: string } }> {
  const { data } = await httpClient.post<{
    workspace: { id: string; slug: string; name: string }
  }>("/api/team/invites/accept", { token })
  return data
}

export async function changeMemberRole(
  membershipId: string,
  role: "admin" | "member",
): Promise<void> {
  await httpClient.patch(`/api/team/members/${membershipId}`, { role })
}

export async function removeMember(membershipId: string): Promise<void> {
  await httpClient.delete(`/api/team/members/${membershipId}`)
}

export async function leaveWorkspace(): Promise<void> {
  await httpClient.post("/api/team/leave", {})
}
