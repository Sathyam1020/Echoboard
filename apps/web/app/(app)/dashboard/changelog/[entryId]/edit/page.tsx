import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { notFound, redirect } from "next/navigation"

import { EditChangelogContent } from "@/components/changelog/edit-changelog-content"
import { getSession } from "@/lib/get-session"
import { ApiError } from "@/lib/http/api-error"
import { queryKeys } from "@/lib/query/keys"
import { makeQueryClient } from "@/lib/query/query-client"
import { fetchChangelogDetailSSR } from "@/services/changelog-admin.server"
import { fetchDashboardBoardsSSR } from "@/services/dashboard.server"

export default async function EditChangelogPage({
  params,
}: {
  params: Promise<{ entryId: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/signin")

  const { entryId } = await params

  const queryClient = makeQueryClient()

  let detail: Awaited<ReturnType<typeof fetchChangelogDetailSSR>>
  try {
    detail = await fetchChangelogDetailSSR(entryId)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    if (err instanceof ApiError && err.status === 403) {
      redirect("/dashboard/changelog")
    }
    throw err
  }
  queryClient.setQueryData(queryKeys.changelog.detail(entryId), detail)

  const boards = await fetchDashboardBoardsSSR()
  queryClient.setQueryData(queryKeys.dashboard.boards(), boards)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EditChangelogContent entryId={entryId} />
    </HydrationBoundary>
  )
}
