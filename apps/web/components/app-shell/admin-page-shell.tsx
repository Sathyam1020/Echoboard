"use client"

import { cn } from "@workspace/ui/lib/utils"
import { type ReactNode } from "react"

import { IconRail } from "@/components/app-shell/icon-rail"
import { ChangelogRail } from "@/components/app-shell/rails/changelog-rail"
import { FeedbackRail } from "@/components/app-shell/rails/feedback-rail"
import { RoadmapRail } from "@/components/app-shell/rails/roadmap-rail"
import { SettingsRail } from "@/components/app-shell/rails/settings-rail"
import { SupportRail } from "@/components/app-shell/rails/support-rail"
import { PageEnter } from "@/components/common/page-enter"
import { useDashboardBoardsQuery } from "@/hooks/use-dashboard"
import { authClient } from "@/lib/auth-client"

import type { SidebarActiveItem, SidebarBoard } from "./app-sidebar-types"

type ActiveSection = Exclude<SidebarActiveItem, null>

// Shared shell wrapper for every admin page. Renders the dual-panel
// sidebar (icon rail + per-section context rail) and the main scroll
// region. Reads boards/session from prefetched react-query state +
// auth session — both populated by `(app)/layout.tsx`.
//
// `fullHeight` opts the page into a flex-column main region (used by
// /dashboard/support so the chat composer stays anchored at the
// viewport bottom).
export function AdminPageShell({
  activeItem,
  fullHeight = false,
  children,
}: {
  activeItem: ActiveSection
  fullHeight?: boolean
  children: ReactNode
}) {
  const { data } = useDashboardBoardsQuery()
  const { data: session } = authClient.useSession()

  if (!data || !session) return null

  const workspaceName = data.boards[0]?.workspaceName ?? "Workspace"
  const workspaceSlug = data.boards[0]?.workspaceSlug
  const boards: SidebarBoard[] = data.boards.map((b) => ({
    id: b.boardId,
    name: b.boardName,
    slug: b.boardSlug,
    workspaceSlug: b.workspaceSlug,
    postCount: b.postCount,
  }))

  return (
    <div className="flex h-screen overflow-hidden">
      <IconRail
        workspaceName={workspaceName}
        activeItem={activeItem}
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
      />
      <SectionRail
        section={activeItem}
        boards={boards}
        workspaceSlug={workspaceSlug}
      />
      <main
        className={cn(
          "flex-1 overflow-y-auto bg-[var(--surface-3)] text-foreground",
          fullHeight && "flex min-h-0 flex-col",
        )}
      >
        <PageEnter
          className={fullHeight ? "flex flex-1 min-h-0 flex-col" : undefined}
        >
          {children}
        </PageEnter>
      </main>
    </div>
  )
}

function SectionRail({
  section,
  boards,
  workspaceSlug,
}: {
  section: ActiveSection
  boards: SidebarBoard[]
  workspaceSlug: string | undefined
}) {
  switch (section) {
    case "feedback":
      return <FeedbackRail boards={boards} workspaceSlug={workspaceSlug ?? ""} />
    case "roadmap":
      return <RoadmapRail workspaceSlug={workspaceSlug} />
    case "changelog":
      return <ChangelogRail workspaceSlug={workspaceSlug} />
    case "support":
      return <SupportRail />
    case "settings":
      return <SettingsRail />
    default:
      return null
  }
}
