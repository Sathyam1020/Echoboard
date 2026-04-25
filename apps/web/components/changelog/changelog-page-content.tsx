"use client"

import { Button } from "@workspace/ui/components/button"
import { ExternalLink, Plus } from "lucide-react"
import Link from "next/link"

import { AdminPageShell } from "@/components/app-shell/admin-page-shell"
import { AppTopbar } from "@/components/app-shell/app-topbar"
import { ChangelogList } from "@/components/changelog/changelog-list"
import { useChangelogListQuery } from "@/hooks/use-changelog"
import { useDashboardBoardsQuery } from "@/hooks/use-dashboard"

export function ChangelogPageContent() {
  const boardsQuery = useDashboardBoardsQuery()
  const listQuery = useChangelogListQuery()

  if (!boardsQuery.data || !listQuery.data) return null
  const { boards } = boardsQuery.data
  const { entries } = listQuery.data

  const first = boards[0]
  const publicHref = first
    ? `/${encodeURIComponent(first.workspaceSlug)}/${encodeURIComponent(first.boardSlug)}/changelog`
    : "/"

  return (
    <AdminPageShell activeItem="changelog">
      <AppTopbar
        title="Changelog"
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <span className="font-mono tabular-nums">{entries.length}</span>
            <span>entr{entries.length === 1 ? "y" : "ies"}</span>
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
    </AdminPageShell>
  )
}
