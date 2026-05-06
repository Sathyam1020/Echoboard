"use client"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { ExternalLink, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { type ReactNode } from "react"

// Shared chrome for every contextual rail (Feedback / Roadmap / Changelog /
// Support / Settings). Header has the module title + an optional public-page
// link; body slot holds the module-specific groups.

export function ContextRail({
  title,
  publicHref,
  actions,
  children,
}: {
  title: string
  publicHref?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <aside
      aria-label={title}
      className="hidden h-full w-60 shrink-0 flex-col border-r border-rail-border bg-rail-panel-bg md:flex"
    >
      <div className="flex h-12 items-center justify-between gap-2 border-b border-rail-border px-4">
        <h2 className="truncate text-[15px] font-medium text-rail-fg">{title}</h2>
        <div className="flex items-center gap-1">
          {actions}
          {publicHref ? (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-7 text-rail-fg-muted hover:bg-rail-hover hover:text-rail-active-fg"
              aria-label={`Open public ${title.toLowerCase()} page`}
            >
              <Link href={publicHref} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">{children}</div>
    </aside>
  )
}

// Section label ("Statuses", "Quick Filters", etc.).
export function RailGroup({
  label,
  children,
  className,
}: {
  label?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("mb-4 last:mb-0", className)}>
      {label ? (
        <div className="mb-1 px-2 text-[11px] font-medium tracking-wide text-rail-fg-subtle uppercase">
          {label}
        </div>
      ) : null}
      <div className="flex flex-col gap-px">{children}</div>
    </div>
  )
}

type RailLinkProps = {
  href?: string
  label: string
  icon?: LucideIcon | (() => ReactNode)
  iconNode?: ReactNode
  badge?: ReactNode
  trailing?: ReactNode
  matchExact?: boolean
  disabled?: boolean
  onClick?: () => void
  active?: boolean
}

// Single row in the rail. Auto-highlights when the current pathname
// matches `href` (or starts with it, unless `matchExact`). Pass
// `active` to override.
export function RailLink({
  href,
  label,
  icon: Icon,
  iconNode,
  badge,
  trailing,
  matchExact,
  disabled,
  onClick,
  active,
}: RailLinkProps) {
  const pathname = usePathname()
  const computedActive = href
    ? matchExact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`)
    : false
  const isActive = active ?? computedActive

  const cls = cn(
    "group/rail-link flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
    isActive
      ? "bg-rail-active text-rail-active-fg font-medium"
      : "text-rail-fg hover:bg-rail-hover hover:text-rail-active-fg",
    disabled && "pointer-events-none opacity-50",
  )

  const inner = (
    <>
      <span className="flex size-4 shrink-0 items-center justify-center text-rail-fg-muted group-hover/rail-link:text-rail-active-fg">
        {iconNode ?? (Icon ? <Icon className="size-[14px]" aria-hidden /> : null)}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge ? (
        <span className="ml-1 font-mono text-[10px] tabular-nums text-rail-fg-muted">
          {badge}
        </span>
      ) : null}
      {trailing}
    </>
  )

  if (!href || disabled) {
    return (
      <button type="button" className={cls} onClick={onClick} disabled={disabled}>
        {inner}
      </button>
    )
  }
  return (
    <Link href={href} className={cls} aria-current={isActive ? "page" : undefined}>
      {inner}
    </Link>
  )
}

// Colored dot used in front of "Statuses" entries and "Categories"
// entries. Tiny — 8px.
export function RailDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="block size-2 rounded-full"
      style={{ background: color }}
    />
  )
}
