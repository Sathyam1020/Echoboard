import { redirect } from "next/navigation"
import { type ReactNode } from "react"

import { AppShell } from "@/components/app-shell/app-shell"
import { AppSidebar } from "@/components/app-shell/app-sidebar"
import { AppTopbar } from "@/components/app-shell/app-topbar"
import { SettingsTabs } from "@/components/settings/settings-tabs"
import { serverApi } from "@/lib/api"
import { getSession } from "@/lib/get-session"

type DashboardBoard = {
  boardId: string
  boardName: string
  boardSlug: string
  boardVisibility: string
  workspaceSlug: string
  workspaceName: string
  postCount: number
  createdAt: string
}

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/signin")

  const { boards } = await serverApi.get<{ boards: DashboardBoard[] }>(
    "/api/dashboard/boards",
  )
  if (boards.length === 0) redirect("/onboarding/board")

  const workspaceName = boards[0]!.workspaceName

  return (
    <AppShell
      sidebar={
        <AppSidebar
          workspaceName={workspaceName}
          boards={boards.map((b) => ({
            id: b.boardId,
            name: b.boardName,
            slug: b.boardSlug,
            workspaceSlug: b.workspaceSlug,
            postCount: b.postCount,
          }))}
          activeItem="settings"
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
        />
      }
    >
      <AppTopbar
        title="Settings"
        subtitle="Manage your workspace, integrations, and widget."
      />
      <SettingsTabs />
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-8">{children}</div>
    </AppShell>
  )
}
