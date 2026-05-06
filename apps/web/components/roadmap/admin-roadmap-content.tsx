"use client"

import { AdminPageShell } from "@/components/app-shell/admin-page-shell"
import { AppTopbar } from "@/components/app-shell/app-topbar"
import { AdminRoadmap } from "@/components/roadmap/admin-roadmap"
import { useDashboardBoardsQuery } from "@/hooks/use-dashboard"
import { useWorkspaceRoadmapQuery } from "@/hooks/queries/use-workspace-roadmap"

export function AdminRoadmapContent() {
  const boardsQuery = useDashboardBoardsQuery()
  const workspaceSlug =
    boardsQuery.data?.boards[0]?.workspaceSlug ?? ""
  const roadmap = useWorkspaceRoadmapQuery({ workspaceSlug })

  if (!boardsQuery.data || !roadmap.data) return null

  return (
    <AdminPageShell activeItem="roadmap">
      <AppTopbar
        title="Roadmap"
        subtitle="Drag cards between columns to change status."
      />

      <div className="px-4 py-6 sm:px-8">
        <AdminRoadmap posts={roadmap.data.posts} />
      </div>
    </AdminPageShell>
  )
}
