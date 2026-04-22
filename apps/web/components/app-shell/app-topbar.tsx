import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { type ReactNode } from "react"

export function AppTopbar({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border bg-background px-4 py-4 sm:px-8 sm:py-5">
      <div className="flex min-w-0 items-start gap-2">
        {/* Mobile-only drawer trigger. Desktop uses the rail/keyboard shortcut. */}
        <SidebarTrigger className="-ml-1.5 mt-0.5 md:hidden" />
        <div className="min-w-0">
          <h1 className="text-xl font-medium -tracking-[0.015em]">{title}</h1>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
