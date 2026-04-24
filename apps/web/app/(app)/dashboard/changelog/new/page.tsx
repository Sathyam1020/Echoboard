import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell/app-shell"
import { AppSidebar } from "@/components/app-shell/app-sidebar"
import { ChangelogEditor } from "@/components/changelog/changelog-editor"
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

export default async function NewChangelogPage() {
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
          activeItem="changelog"
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
        />
      }
    >
      <ChangelogEditor mode="create" />
    </AppShell>
  )
}
