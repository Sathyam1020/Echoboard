"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import { fetchTeamMembers } from "@/services/team"

export function useTeamMembersQuery() {
  return useQuery({
    queryKey: queryKeys.team.members(),
    queryFn: fetchTeamMembers,
    staleTime: 60 * 1000,
  })
}
