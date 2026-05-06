"use client"

import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"

import { SubmitPostDialog } from "./submit-post-dialog"

type TabId = "feedback" | "roadmap" | "changelog"
type BoardOption = { id: string; name: string; slug: string }

// Roadmap + Changelog are workspace-global — their tabs always link
// to /<workspaceSlug>/{roadmap,changelog} regardless of which surface
// the topbar is mounted on. Feedback links to the workspace's
// all-feedback landing if no board context is provided, otherwise to
// the current board's feed.
//
// Submit dialog target: explicit `boardId` (single board) wins;
// otherwise `submitBoardOptions` renders a board-picker; if neither
// is present the Submit CTA is hidden.
export function PublicTopBar({
  workspaceName,
  workspaceSlug,
  workspaceId,
  workspaceOwnerId,
  boardSlug,
  boardId,
  activeTab = "feedback",
  submitBoardOptions,
}: {
  workspaceName: string
  workspaceSlug: string
  workspaceId: string
  workspaceOwnerId: string
  boardSlug?: string
  boardId?: string
  activeTab?: TabId
  /** All-feedback / workspace-level views pass the workspace's public
   *  boards; the submit dialog renders a board picker. When omitted,
   *  the dialog targets the implicit `boardId` directly. */
  submitBoardOptions?: BoardOption[]
}) {
  const initial = (workspaceName.charAt(0) || "E").toUpperCase()

  const allFeedbackHref = `/${encodeURIComponent(workspaceSlug)}`
  const boardHref = boardSlug
    ? `/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(boardSlug)}`
    : allFeedbackHref
  const tabs: Array<{ id: TabId; label: string; href?: string; soon?: boolean }> = [
    { id: "feedback", label: "Feedback", href: boardSlug ? boardHref : allFeedbackHref },
    { id: "roadmap", label: "Roadmap", href: `/${encodeURIComponent(workspaceSlug)}/roadmap` },
    { id: "changelog", label: "Changelog", href: `/${encodeURIComponent(workspaceSlug)}/changelog` },
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
            {submitBoardOptions ? (
              // Board-picker mode (all-feedback / workspace-level surfaces).
              submitBoardOptions.length > 0 ? (
                <SubmitPostDialog
                  boards={submitBoardOptions}
                  workspaceId={workspaceId}
                  workspaceOwnerId={workspaceOwnerId}
                />
              ) : null
            ) : boardId ? (
              <SubmitPostDialog
                boardId={boardId}
                workspaceId={workspaceId}
                workspaceOwnerId={workspaceOwnerId}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
