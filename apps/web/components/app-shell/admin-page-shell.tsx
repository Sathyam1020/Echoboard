"use client"

import { Sheet, SheetContent } from "@workspace/ui/components/sheet"
import { cn } from "@workspace/ui/lib/utils"
import { usePathname } from "next/navigation"
import { type ReactNode, useEffect } from "react"

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
import {
  RailCollapsedProvider,
  useRailCollapsed,
} from "./rail-collapsed-context"

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

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  }

  return (
    <RailCollapsedProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop rails. `display: contents` at md+ so the children
            participate directly in the flex parent — and `display: none`
            below md so they don't double-render alongside the mobile
            drawer. */}
        <div className="hidden md:contents">
          <IconRail
            workspaceName={workspaceName}
            activeItem={activeItem}
            user={user}
          />
          <SectionRail
            section={activeItem}
            boards={boards}
            workspaceSlug={workspaceSlug}
          />
        </div>

        <MobileNavSheet
          activeItem={activeItem}
          workspaceName={workspaceName}
          workspaceSlug={workspaceSlug}
          boards={boards}
          user={user}
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
    </RailCollapsedProvider>
  )
}

function MobileNavSheet({
  activeItem,
  workspaceName,
  workspaceSlug,
  boards,
  user,
}: {
  activeItem: ActiveSection
  workspaceName: string
  workspaceSlug: string | undefined
  boards: SidebarBoard[]
  user: { name: string; email: string; image: string | null | undefined }
}) {
  const { mobileOpen, setMobileOpen } = useRailCollapsed()
  const pathname = usePathname()

  // Auto-close the drawer on route change. Catches cases where a click
  // target inside the rails doesn't go through onClick (e.g. nested
  // <Link> components, programmatic router.push from a rail item).
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname, setMobileOpen])

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent
        side="left"
        className="w-auto max-w-[320px] border-r-0 bg-rail-bg p-0 md:hidden"
        showCloseButton={false}
      >
        <div className="flex h-full">
          <IconRail
            workspaceName={workspaceName}
            activeItem={activeItem}
            user={user}
          />
          <SectionRail
            section={activeItem}
            boards={boards}
            workspaceSlug={workspaceSlug}
          />
        </div>
      </SheetContent>
    </Sheet>
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
