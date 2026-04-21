import { type ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
