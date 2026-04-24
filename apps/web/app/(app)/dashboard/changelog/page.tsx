import { Button } from "@workspace/ui/components/button"
import { ExternalLink, Plus } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell/app-shell"
import { AppSidebar } from "@/components/app-shell/app-sidebar"
import { AppTopbar } from "@/components/app-shell/app-topbar"
import { ChangelogList } from "@/components/changelog/changelog-list"
import type { ChangelogListEntry } from "@/components/changelog/types"
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

export default async function ChangelogAdminPage() {
  const session = await getSession()
  if (!session) redirect("/signin")

  const [{ boards }, { entries }] = await Promise.all([
    serverApi.get<{ boards: DashboardBoard[] }>("/api/dashboard/boards"),
    serverApi.get<{ entries: ChangelogListEntry[] }>("/api/changelog"),
  ])
  if (boards.length === 0) redirect("/onboarding/board")

  const first = boards[0]!
  const workspaceName = first.workspaceName
  const publicHref = `/${encodeURIComponent(first.workspaceSlug)}/${encodeURIComponent(first.boardSlug)}/changelog`

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
      <AppTopbar
        title="Changelog"
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <span className="font-mono tabular-nums">{entries.length}</span>
            <span>
              entr{entries.length === 1 ? "y" : "ies"}
            </span>
            <span aria-hidden>·</span>
            <Link
              href={publicHref}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              View public changelog
              <ExternalLink className="size-3" aria-hidden />
            </Link>
          </span>
        }
        actions={
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/dashboard/changelog/new">
              <Plus className="size-3.5" aria-hidden />
              New entry
            </Link>
          </Button>
        }
      />

      <div className="px-4 py-6 sm:px-8">
        <ChangelogList entries={entries} />
      </div>
    </AppShell>
  )
}
