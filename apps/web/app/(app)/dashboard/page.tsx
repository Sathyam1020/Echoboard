import { redirect } from "next/navigation"

import { SignOutButton } from "@/components/nav/sign-out-button"
import { getSession } from "@/lib/get-session"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/signin")

  const { user } = session

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 px-6 py-12 text-foreground">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl">Hi, {user.name}.</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as{" "}
            <span className="font-mono tabular-nums text-foreground">
              {user.email}
            </span>
          </p>
        </div>
        <SignOutButton />
      </header>

      <section className="rounded-xl border border-border p-6">
        <p className="text-sm text-muted-foreground">
          Your echoboard is empty. Feedback boards, roadmap, and changelog will
          live here once those features ship.
        </p>
      </section>
    </div>
  )
}
