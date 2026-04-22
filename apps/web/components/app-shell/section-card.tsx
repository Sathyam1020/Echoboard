import { type ReactNode } from "react"

export function SectionCard({
  title,
  action,
  children,
  flush = false,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  /** Remove default inner padding when the children own their own padding. */
  flush?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {(title ?? action) ? (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          {title ? <div className="text-sm font-medium">{title}</div> : null}
          {action}
        </div>
      ) : null}
      <div className={flush ? "" : "p-4"}>{children}</div>
    </div>
  )
}
