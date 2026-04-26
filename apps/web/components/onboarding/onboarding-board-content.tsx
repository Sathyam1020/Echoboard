"use client"

import { BoardForm } from "@/components/onboarding/board-form"
import { StepDots } from "@/components/onboarding/step-dots"
import { useWorkspacesMeQuery } from "@/hooks/use-workspaces"

export function OnboardingBoardContent() {
  const { data } = useWorkspacesMeQuery()
  if (!data) return null

  // /api/workspaces/me returns memberships ordered newest-first now, so
  // the workspace just created in Step 1 sits at index 0. (Pre-Phase 2
  // it was at the end of the list — that ordering is gone.)
  const workspace = data.workspaces[0]
  if (!workspace) return null

  return (
    <div className="flex w-full max-w-md flex-col gap-5 rounded-xl border border-border bg-card p-8">
      <StepDots step={2} total={2} />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[22px] font-medium -tracking-[0.015em] leading-tight">
          Create your first board
        </h1>
        <p className="text-[13px] text-muted-foreground">
          A board is where customers submit and vote on feedback.
        </p>
      </div>
      <BoardForm workspaceId={workspace.id} />
    </div>
  )
}
