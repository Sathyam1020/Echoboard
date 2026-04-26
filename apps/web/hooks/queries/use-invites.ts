"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import { fetchTeamInvites } from "@/services/team"

export function useTeamInvitesQuery() {
  return useQuery({
    queryKey: queryKeys.team.invites(),
    queryFn: fetchTeamInvites,
    staleTime: 60 * 1000,
  })
}
