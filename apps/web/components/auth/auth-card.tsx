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
    <div className="flex w-full max-w-sm flex-col gap-5 rounded-xl border border-border bg-card p-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[22px] font-medium -tracking-[0.015em] leading-tight">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-[13px] text-muted-foreground">{subtitle}</p>
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
