"use client"

import { MessagesSquare } from "lucide-react"
import Link from "next/link"

import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import { useSupportConversationsInfiniteQuery } from "@/hooks/queries/use-support-conversations"

// Sidebar Support entry. Reads the conversations cache for the active
// workspace and renders the workspace-wide unread badge. The cache is
// hydrated by the /dashboard/support SSR prefetch — when the user's
// not on that page yet, the query is still up-to-date thanks to the
// WebSocket fan-out hook patching it whenever new messages arrive.

export function SupportNavItem({ isActive }: { isActive: boolean }) {
  const query = useSupportConversationsInfiniteQuery({})

  const conversations =
    query.data?.pages.flatMap((p) => p.conversations) ?? []
  const unread = conversations.reduce((acc, c) => acc + c.unreadAdmin, 0)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip="Support">
        <Link href="/dashboard/support">
          <MessagesSquare className="size-4 shrink-0" aria-hidden />
          <span>Support</span>
        </Link>
      </SidebarMenuButton>
      {unread > 0 ? (
        <SidebarMenuBadge className="bg-primary text-primary-foreground font-mono text-[10px] tabular-nums">
          {unread > 99 ? "99+" : unread}
        </SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  )
}
