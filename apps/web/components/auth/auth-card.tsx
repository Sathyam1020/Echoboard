import { type ReactNode } from "react"

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-background p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">{children}</div>

      {footer ? (
        <div className="border-t border-border pt-4 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  )
}
