import { notFound, redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell/app-shell"
import { AppSidebar } from "@/components/app-shell/app-sidebar"
import { ChangelogEditor } from "@/components/changelog/changelog-editor"
import type {
  ChangelogEntryDetail,
  ShippedPost,
} from "@/components/changelog/types"
import { ApiError, serverApi } from "@/lib/api"
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

export default async function EditChangelogPage({
  params,
}: {
  params: Promise<{ entryId: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/signin")

  const { entryId } = await params

  let detail: { entry: ChangelogEntryDetail }
  try {
    detail = await serverApi.get<{ entry: ChangelogEntryDetail }>(
      `/api/changelog/${encodeURIComponent(entryId)}`,
    )
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    if (err instanceof ApiError && err.status === 403) {
      redirect("/dashboard/changelog")
    }
    throw err
  }

  const { boards } = await serverApi.get<{ boards: DashboardBoard[] }>(
    "/api/dashboard/boards",
  )

  const initialLinkedPosts: ShippedPost[] = detail.entry.linkedPosts.map(
    (p) => ({
      id: p.id,
      title: p.title,
      description: "",
      boardName: p.boardName,
      boardSlug: p.boardSlug,
    }),
  )

  const workspaceName = boards[0]?.workspaceName ?? "Workspace"

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
      <ChangelogEditor
        mode="edit"
        entry={detail.entry}
        initialLinkedPosts={initialLinkedPosts}
      />
    </AppShell>
  )
}
