"use client"

import { PublicFooter } from "@/components/boards/public-footer"
import { PublicSidebar } from "@/components/boards/public-sidebar"
import { PublicTopBar } from "@/components/boards/public-top-bar"
import { PageEnter } from "@/components/common/page-enter"
import { ProfileActivityCard } from "@/components/profile/profile-activity-card"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileImpactCard } from "@/components/profile/profile-impact-card"
import { ProfileTabs } from "@/components/profile/profile-tabs"
import {
  ProfileHeaderSkeleton,
  ProfileSidebarSkeleton,
} from "@/components/skeletons/profile-header-skeleton"
import { useAllFeedbackQuery } from "@/hooks/queries/use-all-feedback"
import { useProfileQuery } from "@/hooks/queries/use-profile"
import { authClient } from "@/lib/auth-client"
import { useVisitorStore } from "@/stores/store-provider"

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

  // "Is this me?" — drives the personal-vs-other empty state copy.
  // Detected from either the Better Auth session (admins) or the
  // visitor store (anonymous identifiers via cookie).
  const { data: session } = authClient.useSession()
  const visitor = useVisitorStore((s) => s.visitor)
  const isSelf =
    (session?.user?.id && session.user.id === actorId) ||
    (visitor?.id && visitor.id === actorId)

  // Both header + sidebar can render skeletons while the meta or
  // profile is loading; main column is a separate skeleton inside
  // each tab's list component.
  const isLoadingChrome =
    (profile.isPending && !profile.data) || (meta.isPending && !meta.data)

  if (isLoadingChrome) {
    return <ProfileSkeleton />
  }
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
              isSelf={Boolean(isSelf)}
              actorName={profile.data.actor.name}
            />
          </main>
        </div>
      </PageEnter>

      <PublicFooter />
    </div>
  )
}

// Full-page skeleton stand-in while the profile + meta queries resolve.
// Mirrors the real layout (header at top, sidebar left, content right)
// so swapping in the real content produces zero shift.
function ProfileSkeleton() {
  return (
    <div className="min-h-svh bg-[var(--surface-3)] text-foreground">
      <div className="h-12 border-b border-border bg-background/85" aria-hidden />
      <PageEnter className="mx-auto max-w-5xl px-6 py-10">
        <ProfileHeaderSkeleton />
        <div className="mt-8 flex flex-col-reverse gap-8 lg:flex-row">
          <div className="lg:w-60 lg:flex-shrink-0">
            <ProfileSidebarSkeleton />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-9" aria-hidden />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl border border-border bg-card motion-safe:animate-pulse"
                  aria-hidden
                />
              ))}
            </div>
          </div>
        </div>
      </PageEnter>
    </div>
  )
}
