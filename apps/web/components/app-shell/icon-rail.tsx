"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import {
  BarChart3,
  Check,
  FileText,
  LifeBuoy,
  Loader2,
  type LucideIcon,
  Map as MapIcon,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Plus,
  Settings as SettingsIcon,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import { useSupportConversationsInfiniteQuery } from "@/hooks/queries/use-support-conversations"
import {
  useActivateWorkspaceMutation,
  useWorkspacesMeQuery,
} from "@/hooks/use-workspaces"
import { ApiError } from "@/lib/http/api-error"
import { setFaviconDot } from "@/lib/favicon-dot"

import { SignOutButton } from "@/components/nav/sign-out-button"
import type { SidebarActiveItem, SidebarUser } from "./app-sidebar-types"
import { useRailCollapsed } from "./rail-collapsed-context"

type NavItem = {
  id: Exclude<SidebarActiveItem, null> | "people" | "analytics"
  label: string
  href: string
  icon: LucideIcon
  disabled?: boolean
}

const NAV: NavItem[] = [
  { id: "feedback", label: "Feedback", href: "/dashboard/feedback", icon: MessageSquare },
  { id: "roadmap", label: "Roadmap", href: "/dashboard/roadmap", icon: MapIcon },
  { id: "changelog", label: "Changelog", href: "/dashboard/changelog", icon: FileText },
  { id: "people", label: "People", href: "#", icon: Users, disabled: true },
  { id: "support", label: "Support", href: "/dashboard/support", icon: LifeBuoy },
  { id: "analytics", label: "Analytics", href: "#", icon: BarChart3, disabled: true },
]

export function IconRail({
  activeItem,
  user,
}: {
  // Workspace name was the source of the brand letter; keeping the prop
  // for callers but no longer rendered (the brand mark is "E" for
  // Echoboard, not the workspace).
  workspaceName: string
  activeItem: SidebarActiveItem
  user: SidebarUser
}) {
  const pathname = usePathname()
  const integrationsActive = pathname?.startsWith("/dashboard/settings/integrations") ?? false
  // Clicking any nav icon also expands the desktop rail (so a same-route
  // Link click doesn't get stuck collapsed) and closes the mobile drawer
  // (Sheet doesn't auto-close on Link clicks).
  const { setCollapsed, setMobileOpen } = useRailCollapsed()
  const onNavClick = () => {
    setCollapsed(false)
    setMobileOpen(false)
  }

  return (
    <TooltipProvider delayDuration={150}>
      <nav
        aria-label="Primary"
        className="flex h-full w-[56px] shrink-0 flex-col items-center gap-1 border-r border-rail-border bg-rail-bg py-3"
      >
        <BrandSwitcher />

        <div className="mt-3 flex flex-1 flex-col items-center gap-0.5">
          {NAV.map((item) =>
            item.id === "support" ? (
              <SupportRailIcon
                key={item.id}
                href={item.href}
                label={item.label}
                Icon={item.icon}
                isActive={activeItem === item.id}
                onNavigate={onNavClick}
              />
            ) : (
              <RailIcon
                key={item.id}
                href={item.href}
                label={item.label}
                Icon={item.icon}
                isActive={activeItem === item.id}
                disabled={item.disabled}
                onNavigate={onNavClick}
              />
            ),
          )}
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <RailIcon
            href="/dashboard/settings/integrations"
            label="Integrations"
            Icon={Plug}
            isActive={integrationsActive}
            onNavigate={onNavClick}
          />
          <RailIcon
            href="/dashboard/settings"
            label="Settings"
            Icon={SettingsIcon}
            isActive={activeItem === "settings"}
            onNavigate={onNavClick}
          />
          <RailCollapseToggle />
          <UserBadge user={user} />
          <div className="-mb-1">
            <SignOutButton iconOnly />
          </div>
        </div>
      </nav>
    </TooltipProvider>
  )
}

// Echoboard brand mark + workspace switcher trigger. Always shows "E"
// (product brand, not the workspace's first letter — admins of multiple
// workspaces tell them apart inside the dropdown). Click → dropdown
// listing memberships with role + an "Activate" affordance, plus
// "Manage team" / "New workspace".
function BrandSwitcher() {
  const router = useRouter()
  const { data } = useWorkspacesMeQuery()
  const activate = useActivateWorkspaceMutation()

  const workspaces = data?.workspaces ?? []
  // /api/workspaces/me bubbles the active workspace to position 0.
  const active = workspaces[0] ?? null

  const [switchingId, setSwitchingId] = useState<string | null>(null)
  const [isRefreshing, startTransition] = useTransition()
  const isSwitching = activate.isPending || isRefreshing

  useEffect(() => {
    if (!isSwitching && switchingId) setSwitchingId(null)
  }, [isSwitching, switchingId])

  function onPick(id: string, name: string) {
    if (id === active?.id || isSwitching) return
    const toastId = toast.loading(`Switching to ${name}…`)
    setSwitchingId(id)
    activate.mutate(id, {
      onSuccess: () => {
        startTransition(() => router.refresh())
        toast.success(`Switched to ${name}`, { id: toastId })
      },
      onError: (err) => {
        toast.error(
          err instanceof ApiError ? err.message : "Couldn't switch workspace",
          { id: toastId },
        )
        setSwitchingId(null)
      },
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isSwitching}
          aria-label="Workspace menu"
          aria-busy={isSwitching}
          className="flex size-9 items-center justify-center rounded-lg bg-brand text-[13px] font-medium text-brand-foreground transition-transform hover:scale-105 active:scale-95 disabled:cursor-progress disabled:opacity-70"
        >
          {isSwitching ? (
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            "E"
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-64">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        {workspaces.map((w) => {
          const isActive = w.id === active?.id
          const isLoadingThis = switchingId === w.id
          return (
            <DropdownMenuItem
              key={w.id}
              disabled={isSwitching}
              onSelect={(e) => {
                if (isSwitching) e.preventDefault()
                onPick(w.id, w.name)
              }}
              className="flex items-center gap-2"
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-[12px] font-medium">
                {w.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-[13px] font-medium">{w.name}</span>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {w.role}
                </span>
              </div>
              {isLoadingThis ? (
                <Loader2 className="ml-auto size-4 animate-spin text-muted-foreground motion-reduce:animate-none" aria-hidden />
              ) : isActive ? (
                <Check className="ml-auto size-4 text-muted-foreground" aria-hidden />
              ) : null}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSwitching}
          onSelect={() => router.push("/dashboard/settings/team")}
        >
          <Users className="mr-2 size-4" aria-hidden /> Manage team
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isSwitching}
          onSelect={() => router.push("/onboarding/workspace")}
        >
          <Plus className="mr-2 size-4" aria-hidden /> New workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RailIcon({
  href,
  label,
  Icon,
  isActive,
  badge,
  disabled,
  onNavigate,
}: {
  href: string
  label: string
  Icon: LucideIcon
  isActive: boolean
  badge?: number
  disabled?: boolean
  onNavigate?: () => void
}) {
  const baseClass =
    "relative flex size-9 items-center justify-center rounded-lg transition-colors"
  const stateClass = isActive
    ? "bg-rail-active text-rail-active-fg"
    : "text-rail-fg-muted hover:bg-rail-hover hover:text-rail-active-fg"
  const cls = cn(baseClass, stateClass, disabled && "pointer-events-none opacity-40")

  const inner = (
    <>
      <Icon className="size-[18px]" strokeWidth={2} aria-hidden />
      {badge && badge > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 font-mono text-[9px] font-medium text-brand-foreground tabular-nums">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {disabled ? (
          <span className={cls} aria-disabled="true">{inner}</span>
        ) : (
          <Link
            href={href}
            className={cls}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
          >
            {inner}
          </Link>
        )}
      </TooltipTrigger>
      <TooltipContent side="right">
        {disabled ? `${label} · Soon` : label}
      </TooltipContent>
    </Tooltip>
  )
}

// Support icon needs the workspace-wide unread badge (drives favicon
// dot + document.title prefix as well).
function SupportRailIcon({
  href,
  label,
  Icon,
  isActive,
  onNavigate,
}: {
  href: string
  label: string
  Icon: LucideIcon
  isActive: boolean
  onNavigate?: () => void
}) {
  const query = useSupportConversationsInfiniteQuery({})
  const conversations = query.data?.pages.flatMap((p) => p.conversations) ?? []
  const unread = conversations.reduce((acc, c) => acc + c.unreadAdmin, 0)

  useEffect(() => {
    if (typeof document === "undefined") return
    const STASH = "__supportOriginalTitle"
    type Stash = { [STASH]?: string }
    const stash = window as unknown as Stash
    if (typeof stash[STASH] !== "string") {
      stash[STASH] = document.title.replace(/^\(\d+\) /, "")
    }
    const apply = () => {
      const hidden = document.visibilityState !== "visible"
      const original = stash[STASH] ?? document.title
      document.title = hidden && unread > 0
        ? `(${unread > 99 ? "99+" : unread}) ${original}`
        : original
    }
    apply()
    document.addEventListener("visibilitychange", apply)
    return () => {
      document.removeEventListener("visibilitychange", apply)
      const original = stash[STASH] ?? document.title
      document.title = original
    }
  }, [unread])

  useEffect(() => {
    void setFaviconDot(unread > 0)
  }, [unread])

  return (
    <RailIcon
      href={href}
      label={label}
      Icon={Icon}
      isActive={isActive}
      badge={unread}
      onNavigate={onNavigate}
    />
  )
}

function RailCollapseToggle() {
  const { collapsed, toggle } = useRailCollapsed()
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose
  const label = collapsed ? "Expand sidebar" : "Collapse sidebar"
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggle}
          aria-label={label}
          aria-pressed={collapsed}
          className="hidden size-9 items-center justify-center rounded-lg text-rail-fg-muted transition-colors hover:bg-rail-hover hover:text-rail-active-fg md:flex"
        >
          <Icon className="size-[18px]" strokeWidth={2} aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

function UserBadge({ user }: { user: SidebarUser }) {
  const initials =
    user.name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="flex size-7 items-center justify-center rounded-full bg-rail-hover text-[10px] font-medium text-rail-fg"
          aria-label={user.name}
        >
          {initials}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <div className="flex flex-col">
          <span className="font-medium">{user.name}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
