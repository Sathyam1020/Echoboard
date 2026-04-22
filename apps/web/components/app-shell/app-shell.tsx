import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar"
import { type ReactNode } from "react"

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
      <SidebarInset className="bg-background text-foreground">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
