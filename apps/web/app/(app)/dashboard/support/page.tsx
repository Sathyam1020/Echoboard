import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import type { Metadata } from "next"

import { AdminSupportContent } from "@/components/support/admin-support-content"
import { queryKeys } from "@/lib/query/keys"
import { makeQueryClient } from "@/lib/query/query-client"
import { fetchSupportConversationsSSR } from "@/services/support.server"

export const metadata: Metadata = {
  title: "Support",
  robots: { index: false, follow: false },
}

export default async function SupportPage() {
  const queryClient = makeQueryClient()
  const list = await fetchSupportConversationsSSR()
  // Hydrate the empty-filter list — that's what the page lands on. Other
  // filter combos fetch lazily client-side.
  queryClient.setQueryData(queryKeys.support.conversations({}), {
    pages: [list],
    pageParams: [null],
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminSupportContent />
    </HydrationBoundary>
  )
}
