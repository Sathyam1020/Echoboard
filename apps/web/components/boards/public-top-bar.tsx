"use client"

import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"

import { SubmitPostDialog } from "./submit-post-dialog"

type TabId = "feedback" | "roadmap" | "changelog"

export function PublicTopBar({
  workspaceName,
  workspaceSlug,
  workspaceId,
  workspaceOwnerId,
  boardSlug,
  boardId,
  activeTab = "feedback",
  hideSubmitDialog = false,
}: {
  workspaceName: string
  workspaceSlug: string
  workspaceId: string
  workspaceOwnerId: string
  boardSlug: string
  boardId: string
  activeTab?: TabId
  /** Submit-post dialog requires a single target board. The all-feedback
   *  view has no implicit target, so hide it there. */
  hideSubmitDialog?: boolean
}) {
  const initial = (workspaceName.charAt(0) || "E").toUpperCase()

  // The Feedback tab is now the workspace's "All feedback" landing —
  // a per-board feed view is just a filter applied via the sidebar.
  // Roadmap and Changelog stay per-board because their content is
  // board-scoped (status pipelines + per-board release notes).
  const allFeedbackHref = `/${encodeURIComponent(workspaceSlug)}`
  const boardHref = `/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(boardSlug)}`
  const tabs: Array<{ id: TabId; label: string; href?: string; soon?: boolean }> = [
    { id: "feedback", label: "Feedback", href: allFeedbackHref },
    { id: "roadmap", label: "Roadmap", href: `${boardHref}/roadmap` },
    { id: "changelog", label: "Changelog", href: `${boardHref}/changelog` },
  ]

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Two-row layout below sm: identity + CTA on top, tab strip below.
            sm+ collapses both rows into one. The tab strip is independently
            horizontally-scrollable on phones so long workspace names never
            squeeze the nav. */}
        <div className="flex flex-wrap items-center gap-3 pt-3 sm:flex-nowrap sm:gap-4 sm:py-3">
          <Link
            href={allFeedbackHref}
            className="flex min-w-0 items-center gap-2.5"
          >
            <span className="flex size-[22px] shrink-0 items-center justify-center rounded-md bg-foreground font-mono text-[12px] font-medium text-background">
              {initial}
            </span>
            <span className="truncate text-sm font-medium">
              {workspaceName}
            </span>
          </Link>

          <nav className="-mx-4 order-3 flex w-screen max-w-none gap-1 overflow-x-auto px-4 pb-2 scrollbar-thin sm:order-2 sm:mx-0 sm:ml-5 sm:w-auto sm:overflow-visible sm:px-0 sm:pb-0">
            {tabs.map((t) => {
              const active = activeTab === t.id
              const cls = cn(
                "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors",
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground",
                t.soon && "cursor-not-allowed opacity-70",
                !t.soon && !active && "hover:text-foreground",
              )
              if (t.soon || !t.href) {
                return (
                  <span key={t.id} aria-disabled={true} className={cls}>
                    {t.label}
                    {t.soon ? (
                      <span className="text-[10px] tracking-wider text-foreground-subtle uppercase">
                        Soon
                      </span>
                    ) : null}
                  </span>
                )
              }
              return (
                <Link key={t.id} href={t.href} className={cls}>
                  {t.label}
                </Link>
              )
            })}
          </nav>

          <div className="order-2 ml-auto flex shrink-0 items-center gap-3 sm:order-3">
            {hideSubmitDialog ? null : (
              <SubmitPostDialog
                boardId={boardId}
                workspaceId={workspaceId}
                workspaceOwnerId={workspaceOwnerId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
