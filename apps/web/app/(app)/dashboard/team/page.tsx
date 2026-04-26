import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { redirect } from "next/navigation"

import { TeamPageContent } from "@/components/team/team-page-content"
import { getSession } from "@/lib/get-session"
import { queryKeys } from "@/lib/query/keys"
import { makeQueryClient } from "@/lib/query/query-client"
import {
  fetchTeamInvitesSSR,
  fetchTeamMembersSSR,
} from "@/services/team.server"

export default async function TeamPage() {
  const session = await getSession()
  if (!session) redirect("/signin")

  const queryClient = makeQueryClient()
  // Members visible to every role; invites only to admin+. We let the
  // backend gate it — if the user is a plain member, the invites query
  // 403s and the UI hides the panel.
  const [members, invites] = await Promise.allSettled([
    fetchTeamMembersSSR(),
    fetchTeamInvitesSSR(),
  ])
  if (members.status === "fulfilled") {
    queryClient.setQueryData(queryKeys.team.members(), members.value)
  }
  if (invites.status === "fulfilled") {
    queryClient.setQueryData(queryKeys.team.invites(), invites.value)
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeamPageContent canManage={invites.status === "fulfilled"} />
    </HydrationBoundary>
  )
}
