import { type ReactNode } from "react"

export function SettingsSection({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="border-b border-border px-5 py-4">
        <h2 className="text-[14px] font-medium">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            {description}
          </p>
        ) : null}
      </header>
      <div className="flex flex-col gap-4 px-5 py-5">{children}</div>
      {footer ? (
        <footer className="flex items-center justify-end gap-2 border-t border-border-soft bg-muted/40 px-5 py-3">
          {footer}
        </footer>
      ) : null}
    </section>
  )
}
