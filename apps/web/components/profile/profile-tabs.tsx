"use client"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { useRouter, useSearchParams } from "next/navigation"

import { ProfileCommentList } from "./profile-comment-list"
import { ProfileFeedbackList } from "./profile-feedback-list"

type TabId = "feedback" | "comments"

// Tabbed body for the profile page — Feedback (default) | Comments.
// Tab is encoded in the URL via `?tab=` so deep-links and refreshes
// preserve the active tab.
export function ProfileTabs({
  workspaceSlug,
  workspaceId,
  workspaceOwnerId,
  actorId,
  isSelf,
  actorName,
}: {
  workspaceSlug: string
  workspaceId: string
  workspaceOwnerId: string
  actorId: string
  isSelf?: boolean
  actorName: string
}) {
  const router = useRouter()
  const params = useSearchParams()
  const tab: TabId = params.get("tab") === "comments" ? "comments" : "feedback"

  function setTab(next: TabId) {
    const search = new URLSearchParams(params.toString())
    if (next === "feedback") search.delete("tab")
    else search.set("tab", next)
    const qs = search.toString()
    router.replace(qs ? `?${qs}` : "?", { scroll: false })
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as TabId)}
      className="items-stretch"
    >
      <TabsList className="-ml-2 h-auto cursor-pointer bg-transparent p-0">
        <TabsTrigger
          value="feedback"
          className="cusror-pointer rounded-md px-3 py-1.5 text-[13.5px] font-medium text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
        >
          Feedback
        </TabsTrigger>
        <TabsTrigger
          value="comments"
          className="cursor-pointer rounded-md px-3 py-1.5 text-[13.5px] font-medium text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
        >
          Comments
        </TabsTrigger>
      </TabsList>

      <TabsContent value="feedback" className="mt-5">
        <ProfileFeedbackList
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          workspaceOwnerId={workspaceOwnerId}
          actorId={actorId}
          isSelf={isSelf}
          actorName={actorName}
        />
      </TabsContent>
      <TabsContent value="comments" className="mt-5">
        <ProfileCommentList
          workspaceSlug={workspaceSlug}
          actorId={actorId}
          isSelf={isSelf}
          actorName={actorName}
        />
      </TabsContent>
    </Tabs>
  )
}
