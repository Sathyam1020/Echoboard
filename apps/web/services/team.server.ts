import "server-only"

import { serverHttp } from "@/lib/http/server-axios"

import type {
  InvitePreview,
  TeamInvitesResponse,
  TeamMembersResponse,
} from "./team"

export function fetchTeamMembersSSR(): Promise<TeamMembersResponse> {
  return serverHttp.get<TeamMembersResponse>("/api/team/members")
}

export function fetchTeamInvitesSSR(): Promise<TeamInvitesResponse> {
  return serverHttp.get<TeamInvitesResponse>("/api/team/invites")
}

export function fetchInvitePreviewSSR(token: string): Promise<InvitePreview> {
  return serverHttp.get<InvitePreview>(
    `/api/team/invites/preview?token=${encodeURIComponent(token)}`,
  )
}
