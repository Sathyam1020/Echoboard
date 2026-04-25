import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar"
import { type ReactNode } from "react"

// Page area uses surface-3 (subtle warm-neutral tint) instead of plain
// `bg-background` (#fff) so white-card surfaces (`bg-card`) actually pop.
// Without this, every dashboard page reads as one continuous white field —
// metric cards, section cards, etc. all blend into the page bg.
export function AppShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode
  children: ReactNode
}) {
  return (
    <SidebarProvider>
      {sidebar}
      <SidebarInset className="bg-[var(--surface-3)] text-foreground">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
