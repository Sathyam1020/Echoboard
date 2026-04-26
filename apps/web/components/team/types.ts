export type WorkspaceRole = "owner" | "admin" | "member"

export type TeamMemberRow = {
  membershipId: string
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
  role: WorkspaceRole
  joinedAt: string
}

export type PendingInviteRow = {
  id: string
  email: string
  role: WorkspaceRole
  invitedBy: { id: string; name: string }
  expiresAt: string
  createdAt: string
}
