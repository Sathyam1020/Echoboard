import { FileTextIcon } from "@workspace/ui/components/file-text"
import { LayoutGridIcon } from "@workspace/ui/components/layout-grid"
import { MessageCircleIcon } from "@workspace/ui/components/message-circle"
import { MessageSquareIcon } from "@workspace/ui/components/message-square"
import { PlusIcon } from "@workspace/ui/components/plus"
import { RouteIcon } from "@workspace/ui/components/route"
import { SettingsIcon } from "@workspace/ui/components/settings"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar"
import { Users } from "lucide-react"
import Link from "next/link"

import { SignOutButton } from "@/components/nav/sign-out-button"

import { AnimatedNavItem, AnimatedNavItemDisabled } from "./animated-nav-item"
import { WorkspaceSwitcher } from "./workspace-switcher"

export type SidebarBoard = {
  id: string
  name: string
  slug: string
  workspaceSlug: string
  postCount: number
}

export type SidebarUser = {
  name: string
  email: string
  image?: string | null
}

export type SidebarActiveItem =
  | "dashboard"
  | "feedback"
  | "roadmap"
  | "changelog"
  | "comments"
  | "analytics"
  | "team"
  | "support"
  | "settings"
  | null

const BOARD_DOT_COLORS = [
  "var(--status-shipped-dot)",
  "var(--status-planned-dot)",
  "var(--status-progress-dot)",
  "var(--status-review-dot)",
]

export function AppSidebar({
  workspaceName,
  boards,
  activeItem,
  user,
}: {
  workspaceName: string
  boards: SidebarBoard[]
  activeItem: SidebarActiveItem
  user: SidebarUser
}) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-2 pb-0">
        <WorkspaceSwitcher fallbackName={workspaceName} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <AnimatedNavItem
              icon={LayoutGridIcon}
              label="Dashboard"
              href="/dashboard"
              isActive={activeItem === "dashboard"}
            />
            <AnimatedNavItem
              icon={MessageSquareIcon}
              label="Feedback"
              href="/dashboard/feedback"
              isActive={activeItem === "feedback"}
            />
            <AnimatedNavItem
              icon={RouteIcon}
              label="Roadmap"
              href="/dashboard/roadmap"
              isActive={activeItem === "roadmap"}
            />
            <AnimatedNavItem
              icon={FileTextIcon}
              label="Changelog"
              href="/dashboard/changelog"
              isActive={activeItem === "changelog"}
            />
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={activeItem === "team"}
                tooltip="Team"
              >
                <Link href="/dashboard/team">
                  <Users
                    className="size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>Team</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <AnimatedNavItem
              icon={SettingsIcon}
              label="Settings"
              href="/dashboard/settings"
              isActive={activeItem === "settings"}
            />
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Boards</SidebarGroupLabel>
          <SidebarMenu>
            {boards.map((b, idx) => (
              <SidebarMenuItem key={b.id}>
                <SidebarMenuButton
                  asChild
                  tooltip={`${b.name} · ${b.postCount} posts`}
                >
                  <Link href={`/${b.workspaceSlug}/${b.slug}`}>
                    {/* 16x16 wrapper matches the icon footprint shadcn
                        applies to SVGs (`[&_svg]:size-4`). Without it
                        the 9px dot drifts left in the collapsed state
                        because the flex gap still allocates space for
                        the truncated label span. */}
                    <span
                      aria-hidden="true"
                      className="flex size-4 shrink-0 items-center justify-center"
                    >
                      <span
                        className="size-[9px] rounded-full transition-transform duration-200 ease-out group-hover/menu-button:scale-125"
                        style={{
                          background:
                            BOARD_DOT_COLORS[idx % BOARD_DOT_COLORS.length],
                        }}
                      />
                    </span>
                    <span className="truncate">{b.name}</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuBadge className="font-mono text-[11px] tabular-nums">
                  {b.postCount}
                </SidebarMenuBadge>
              </SidebarMenuItem>
            ))}
            <AnimatedNavItemDisabled
              icon={PlusIcon}
              label="New board"
              tooltip="New board · Coming soon"
              badge={null}
              size="sm"
            />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2.5 border-t border-sidebar-border px-2 py-2 group-data-[collapsible=icon]:hidden">
          <UserInitials name={user.name} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] leading-tight font-medium">
              {user.name}
            </div>
            <div className="text-[11px] leading-none text-muted-foreground">
              Admin
            </div>
          </div>
          <SignOutButton iconOnly />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

function UserInitials({ name }: { name: string }) {
  const initials =
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  return (
    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[11px] font-medium">
      {initials}
    </div>
  )
}
