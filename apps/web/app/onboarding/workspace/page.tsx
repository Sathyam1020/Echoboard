import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { StepDots } from "@/components/onboarding/step-dots"
import { WorkspaceForm } from "@/components/onboarding/workspace-form"
import { getSession } from "@/lib/get-session"

export const metadata: Metadata = {
  title: "Create your workspace",
  robots: { index: false, follow: false },
}

export default async function OnboardingWorkspacePage() {
  const session = await getSession()
  if (!session) redirect("/signin?redirectTo=/onboarding/workspace")

  return (
    <div className="flex w-full max-w-md flex-col gap-5 rounded-xl border border-border bg-card p-8">
      <StepDots step={1} total={2} />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[22px] font-medium -tracking-[0.015em] leading-tight">
          Create your workspace
        </h1>
        <p className="text-[13px] text-muted-foreground">
          This is where all your boards live.
        </p>
      </div>
      <WorkspaceForm />
    </div>
  )
}
