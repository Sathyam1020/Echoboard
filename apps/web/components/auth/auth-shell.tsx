import Link from "next/link"
import { type ReactNode } from "react"

export function AuthShell({
  children,
  footer,
  wide = false,
}: {
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-10 text-foreground">
      <div className="mb-7">
        <Link
          href="/"
          className="text-lg font-medium tracking-tight text-foreground"
        >
          echoboard
        </Link>
      </div>

      <div className={wide ? "w-full max-w-md" : "w-full max-w-sm"}>
        {children}
      </div>

      {footer ? (
        <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
      ) : null}
    </div>
  )
}
