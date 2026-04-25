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
}: {
  workspaceName: string
  workspaceSlug: string
  workspaceId: string
  workspaceOwnerId: string
  boardSlug: string
  boardId: string
  activeTab?: TabId
}) {
  const initial = (workspaceName.charAt(0) || "E").toUpperCase()

  const boardHref = `/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(boardSlug)}`
  const tabs: Array<{ id: TabId; label: string; href?: string; soon?: boolean }> = [
    { id: "feedback", label: "Feedback", href: boardHref },
    { id: "roadmap", label: "Roadmap", href: `${boardHref}/roadmap` },
    { id: "changelog", label: "Changelog", href: `${boardHref}/changelog` },
  ]

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-6 py-3">
        <Link href={boardHref} className="flex items-center gap-2.5">
          <span className="flex size-[22px] items-center justify-center rounded-md bg-foreground font-mono text-[12px] font-medium text-background">
            {initial}
          </span>
          <span className="text-sm font-medium">{workspaceName}</span>
        </Link>

        <nav className="ml-5 flex gap-1">
          {tabs.map((t) => {
            const active = activeTab === t.id
            const cls = cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors",
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

        <div className="ml-auto flex items-center gap-3">
          <SubmitPostDialog
            boardId={boardId}
            workspaceId={workspaceId}
            workspaceOwnerId={workspaceOwnerId}
          />
        </div>
      </div>
    </div>
  )
}
