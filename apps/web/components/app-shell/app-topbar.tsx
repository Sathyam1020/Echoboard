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
    <div className="flex flex-col gap-3 border-b border-border bg-background px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-8 sm:py-5">
      <div className="min-w-0">
        <h1 className="text-xl font-medium -tracking-[0.015em]">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
