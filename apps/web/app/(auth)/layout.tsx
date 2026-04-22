import { type ReactNode } from "react"

// The auth pages (signin, signup) each render their own AuthShell so they can
// supply their own footer (different copy). This layout is intentionally a
// pass-through.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
