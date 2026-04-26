"use client"

import { Inbox } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import { useSupportConversationsInfiniteQuery } from "@/hooks/queries/use-support-conversations"
import { setFaviconDot } from "@/lib/favicon-dot"

// Sidebar Inbox entry. Reads the conversations cache for the active
// workspace and renders the workspace-wide unread badge. Also drives
// the document.title prefix + favicon dot side effects since this
// component is mounted on every admin dashboard page (via the
// sidebar) — the WS-driven cache is the single source of truth for
// "do you have unread messages right now?".

const ORIGINAL_TITLE_KEY = "__supportOriginalTitle"

export function SupportNavItem({ isActive }: { isActive: boolean }) {
  const query = useSupportConversationsInfiniteQuery({})

  const conversations =
    query.data?.pages.flatMap((p) => p.conversations) ?? []
  const unread = conversations.reduce((acc, c) => acc + c.unreadAdmin, 0)

  // document.title prefix when the tab is HIDDEN and there are unread
  // messages. Restored when unread → 0 OR the tab regains focus. We
  // stash the original title on a window-scoped key so multiple
  // instances of this component don't fight over the original.
  useEffect(() => {
    if (typeof document === "undefined") return
    type Stash = { [ORIGINAL_TITLE_KEY]?: string }
    const stash = window as unknown as Stash
    if (typeof stash[ORIGINAL_TITLE_KEY] !== "string") {
      stash[ORIGINAL_TITLE_KEY] = document.title.replace(/^\(\d+\) /, "")
    }
    const restore = () => {
      const original = stash[ORIGINAL_TITLE_KEY] ?? document.title
      document.title = original
    }
    const apply = () => {
      const hidden = document.visibilityState !== "visible"
      const original = stash[ORIGINAL_TITLE_KEY] ?? document.title
      if (hidden && unread > 0) {
        document.title = `(${unread > 99 ? "99+" : unread}) ${original}`
      } else {
        document.title = original
      }
    }
    apply()
    document.addEventListener("visibilitychange", apply)
    return () => {
      document.removeEventListener("visibilitychange", apply)
      restore()
    }
  }, [unread])

  // Favicon dot — visible whenever there's at least one unread,
  // regardless of tab focus, so a quick glance at a stack of tabs
  // shows where the unread is.
  useEffect(() => {
    void setFaviconDot(unread > 0)
  }, [unread])

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip="Inbox">
        <Link href="/dashboard/support">
          <Inbox className="size-4 shrink-0" aria-hidden />
          <span>Inbox</span>
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
