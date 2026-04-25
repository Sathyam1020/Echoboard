"use client"

import { type ReactNode } from "react"

import { AdminPageShell } from "@/components/app-shell/admin-page-shell"
import { AppTopbar } from "@/components/app-shell/app-topbar"
import { SettingsTabs } from "@/components/settings/settings-tabs"

export function SettingsShellContent({ children }: { children: ReactNode }) {
  return (
    <AdminPageShell activeItem="settings">
      <AppTopbar
        title="Settings"
        subtitle="Manage your workspace, integrations, and widget."
      />
      <SettingsTabs />
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-8">{children}</div>
    </AdminPageShell>
  )
}
