"use client"

import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { id: "general", label: "General", href: "/dashboard/settings" },
  { id: "widget", label: "Widget", href: "/dashboard/settings/widget" },
  { id: "team", label: "Team", href: "/dashboard/settings/team" },
  {
    id: "integrations",
    label: "Integrations",
    href: "/dashboard/settings/integrations",
  },
  { id: "billing", label: "Billing", href: "/dashboard/settings/billing" },
  { id: "import", label: "Import", href: "/dashboard/settings/import" },
] as const

export function SettingsTabs() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Settings tabs"
      className="flex flex-wrap gap-1 border-b border-border px-4 sm:px-8"
    >
      {TABS.map((t) => {
        // Exact match for /dashboard/settings, prefix match for nested routes.
        const active =
          t.href === "/dashboard/settings"
            ? pathname === t.href
            : pathname.startsWith(t.href)
        return (
          <Link
            key={t.id}
            href={t.href}
            className={cn(
              "relative -mb-px border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors",
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
