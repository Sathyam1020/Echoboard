"use client"

import {
  CreditCard,
  Download,
  type LucideIcon,
  Plug,
  Settings as SettingsIcon,
  SquareCode,
  Users,
} from "lucide-react"

import { ContextRail, RailGroup, RailLink } from "../context-rail"

const ITEMS: Array<{ label: string; href: string; icon: LucideIcon; matchExact?: boolean }> = [
  { label: "General", href: "/dashboard/settings", icon: SettingsIcon, matchExact: true },
  { label: "Widget", href: "/dashboard/settings/widget", icon: SquareCode },
  { label: "Team", href: "/dashboard/settings/team", icon: Users },
  { label: "Integrations", href: "/dashboard/settings/integrations", icon: Plug },
  { label: "Billing", href: "/dashboard/settings/billing", icon: CreditCard },
  { label: "Import", href: "/dashboard/settings/import", icon: Download },
]

export function SettingsRail() {
  return (
    <ContextRail title="Settings">
      <RailGroup>
        {ITEMS.map((it) => (
          <RailLink
            key={it.href}
            href={it.href}
            label={it.label}
            icon={it.icon}
            matchExact={it.matchExact}
          />
        ))}
      </RailGroup>
    </ContextRail>
  )
}
