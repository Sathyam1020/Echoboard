"use client"

import { Button } from "@workspace/ui/components/button"
import { Menu } from "lucide-react"
import { type ReactNode } from "react"

import { useRailCollapsed } from "./rail-collapsed-context"

export function AppTopbar({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  const { setMobileOpen } = useRailCollapsed()
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-background px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-8 sm:py-5">
      <div className="flex min-w-0 items-start gap-2 sm:gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-ml-1 size-9 shrink-0 md:hidden"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-5" aria-hidden />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-medium -tracking-[0.015em]">{title}</h1>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
