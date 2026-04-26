"use client"

import { type ReactNode } from "react"

import { AppShell } from "@/components/app-shell/app-shell"
import { AppSidebar } from "@/components/app-shell/app-sidebar"
import { PageEnter } from "@/components/common/page-enter"
import { useDashboardBoardsQuery } from "@/hooks/use-dashboard"
import { authClient } from "@/lib/auth-client"

// Shared shell wrapper for every admin page. Reads boards from the
// react-query cache (hydrated by the parent server page's prefetch),
// then composes AppShell + AppSidebar with the active sidebar item the
// page passes in. Page bodies render as `children`.
export function AdminPageShell({
  activeItem,
  children,
}: {
  activeItem:
    | "dashboard"
    | "feedback"
    | "roadmap"
    | "changelog"
    | "support"
    | "settings"
  children: ReactNode
}) {
  const { data } = useDashboardBoardsQuery()
  const { data: session } = authClient.useSession()

  // Server prefetched both before render — should never be undefined here.
  if (!data || !session) return null

  const workspaceName = data.boards[0]?.workspaceName ?? "Workspace"

  return (
    <AppShell
      sidebar={
        <AppSidebar
          workspaceName={workspaceName}
          boards={data.boards.map((b) => ({
            id: b.boardId,
            name: b.boardName,
            slug: b.boardSlug,
            workspaceSlug: b.workspaceSlug,
            postCount: b.postCount,
          }))}
          activeItem={activeItem}
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
        />
      }
    >
      <PageEnter>{children}</PageEnter>
    </AppShell>
  )
}
