"use client"

import { PublicFooter } from "@/components/boards/public-footer"
import { PublicSidebar } from "@/components/boards/public-sidebar"
import { PublicTopBar } from "@/components/boards/public-top-bar"
import { PageEnter } from "@/components/common/page-enter"
import { ProfileActivityCard } from "@/components/profile/profile-activity-card"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileImpactCard } from "@/components/profile/profile-impact-card"
import { ProfileTabs } from "@/components/profile/profile-tabs"
import { useAllFeedbackQuery } from "@/hooks/queries/use-all-feedback"
import { useProfileQuery } from "@/hooks/queries/use-profile"

export function PublicProfileContent({
  workspaceSlug,
  actorId,
}: {
  workspaceSlug: string
  actorId: string
}) {
  // Profile data drives the header + sidebar cards. The all-feedback
  // metadata gives us the workspace's first public board to anchor the
  // top bar's Roadmap/Changelog tabs (matches the all-feedback view).
  const profile = useProfileQuery({ workspaceSlug, actorId })
  const meta = useAllFeedbackQuery(workspaceSlug)
  if (!profile.data || !meta.data) return null

  const anchorBoard = meta.data.workspaceBoards[0]
  const anchorBoardSlug = anchorBoard?.slug ?? ""
  const anchorBoardId = anchorBoard?.id ?? ""

  return (
    <div className="min-h-svh bg-[var(--surface-3)] text-foreground">
      <PublicTopBar
        workspaceName={profile.data.workspace.name}
        workspaceSlug={profile.data.workspace.slug}
        workspaceId={meta.data.workspace.id}
        workspaceOwnerId={meta.data.workspace.ownerId}
        boardSlug={anchorBoardSlug}
        boardId={anchorBoardId}
        activeTab="feedback"
        submitBoardOptions={meta.data.workspaceBoards}
      />

      <PageEnter className="mx-auto max-w-5xl px-6 py-10">
        <ProfileHeader profile={profile.data} />

        <div className="mt-8 flex flex-col-reverse gap-8 lg:flex-row">
          <PublicSidebar className="lg:w-60 lg:flex-shrink-0">
            <ProfileActivityCard activity={profile.data.activity} />
            <ProfileImpactCard impact={profile.data.impact} />
          </PublicSidebar>

          <main className="min-w-0 flex-1">
            <ProfileTabs
              workspaceSlug={profile.data.workspace.slug}
              workspaceId={meta.data.workspace.id}
              workspaceOwnerId={meta.data.workspace.ownerId}
              actorId={profile.data.actor.id}
            />
          </main>
        </div>
      </PageEnter>

      <PublicFooter />
    </div>
  )
}
