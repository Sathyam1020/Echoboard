import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { type ReactNode } from "react"

import { getSession } from "@/lib/get-session"
import {
  fetchDashboardBoardsSSR,
} from "@/services/dashboard.server"
import { fetchWorkspacesMeSSR } from "@/services/workspaces.server"

// Dashboard surfaces are auth-gated and contain no public-search-relevant
// content. Block crawlers explicitly so the noindex tag is set even when a
// crawler somehow lands here (e.g., misconfigured links from outside).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// Admin shell guard. Auth + onboarding redirects only — no rendering of
// remote data here, so we don't need HydrationBoundary at this layer.
// Per-route pages do their own prefetch + hydrate.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/signin")

  const { workspaces } = await fetchWorkspacesMeSSR()
  if (workspaces.length === 0) redirect("/onboarding/workspace")

  const { boards } = await fetchDashboardBoardsSSR()
  if (boards.length === 0) redirect("/onboarding/board")

  // Dogfood widget — embedded in every admin's dashboard so visiting
  // signed-in users hit the SAME workspace's widget (the dogfood owner's),
  // not their own. Their support messages land in the dogfood workspace's
  // /dashboard/support inbox. Configured via NEXT_PUBLIC_DOGFOOD_BOARD_ID;
  // unset → no widget rendered.
  const dogfoodBoardId = process.env.NEXT_PUBLIC_DOGFOOD_BOARD_ID

  return (
    <>
      {children}
      {dogfoodBoardId ? (
        <script
          src="http://localhost:3000/widget.js"
          data-board-id={dogfoodBoardId}
          async
        ></script>
      ) : null}
    </>
  )
}
