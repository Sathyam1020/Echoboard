import { redirect } from "next/navigation"

import { BoardForm } from "@/components/onboarding/board-form"
import { StepDots } from "@/components/onboarding/step-dots"
import { serverApi } from "@/lib/api"
import { getSession } from "@/lib/get-session"

type Workspace = {
  id: string
  name: string
  slug: string
  createdAt: string
}

export default async function OnboardingBoardPage() {
  const session = await getSession()
  if (!session) redirect("/signin?redirectTo=/onboarding/board")

  const { workspaces } = await serverApi.get<{ workspaces: Workspace[] }>(
    "/api/workspaces/me",
  )
  if (workspaces.length === 0) redirect("/onboarding/workspace")

  // Most recent workspace is the one just created in Step 1.
  const workspace = workspaces[workspaces.length - 1]!

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
