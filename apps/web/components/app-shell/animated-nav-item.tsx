"use client"

import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import Link from "next/link"
import * as React from "react"

export interface AnimatedIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

export interface AnimatedIconProps
  extends React.HTMLAttributes<HTMLDivElement> {
  size?: number
}

export type AnimatedIcon = React.ForwardRefExoticComponent<
  AnimatedIconProps & React.RefAttributes<AnimatedIconHandle>
>

// Plays the icon animation when the user hovers anywhere on the LI row —
// not just the tiny 16px icon hit-box that the animated icon owns by default.
function useIconHover() {
  const ref = React.useRef<AnimatedIconHandle>(null)
  const onMouseEnter = React.useCallback(() => {
    ref.current?.startAnimation()
  }, [])
  const onMouseLeave = React.useCallback(() => {
    ref.current?.stopAnimation()
  }, [])
  return { ref, onMouseEnter, onMouseLeave }
}

export function AnimatedNavItem({
  icon: Icon,
  label,
  href,
  isActive,
  tooltip,
}: {
  icon: AnimatedIcon
  label: string
  href: string
  isActive?: boolean
  tooltip?: string
}) {
  const { ref, onMouseEnter, onMouseLeave } = useIconHover()
  return (
    <SidebarMenuItem onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <SidebarMenuButton asChild isActive={isActive} tooltip={tooltip ?? label}>
        <Link href={href}>
          <Icon ref={ref} size={16} aria-hidden="true" className="shrink-0" />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AnimatedNavItemDisabled({
  icon: Icon,
  label,
  tooltip,
  badge = "Soon",
  size = "default",
}: {
  icon: AnimatedIcon
  label: string
  tooltip?: string
  badge?: React.ReactNode
  size?: "default" | "sm"
}) {
  const { ref, onMouseEnter, onMouseLeave } = useIconHover()
  return (
    <SidebarMenuItem onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <SidebarMenuButton
        aria-disabled="true"
        size={size}
        tooltip={tooltip ?? `${label} · Coming soon`}
        // pointer-events-auto overrides aria-disabled:pointer-events-none from
        // the base variant so tooltips + animation still fire on hover.
        className="cursor-not-allowed opacity-60 aria-disabled:pointer-events-auto"
      >
        <Icon ref={ref} size={16} aria-hidden="true" className="shrink-0" />
        <span>{label}</span>
      </SidebarMenuButton>
      {badge ? (
        <SidebarMenuBadge className="text-[9px] uppercase tracking-wider text-foreground-subtle">
          {badge}
        </SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  )
}
