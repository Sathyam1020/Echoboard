"use client"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { authClient } from "@/lib/auth-client"

import { SubmitPostDialog } from "./submit-post-dialog"

const TABS = [
  { id: "feedback", label: "Feedback", live: true },
  { id: "roadmap", label: "Roadmap", live: false },
  { id: "changelog", label: "Changelog", live: false },
] as const

export function PublicTopBar({
  workspaceName,
  boardId,
  activeTab = "feedback",
}: {
  workspaceName: string
  boardId: string
  activeTab?: (typeof TABS)[number]["id"]
}) {
  const { data: session } = authClient.useSession()
  const pathname = usePathname()
  const initial = (workspaceName.charAt(0) || "E").toUpperCase()
  const signinHref = `/signin?redirectTo=${encodeURIComponent(pathname)}`

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-[22px] items-center justify-center rounded-md bg-foreground font-mono text-[12px] font-medium text-background">
            {initial}
          </span>
          <span className="text-sm font-medium">{workspaceName}</span>
          <span className="text-sm text-muted-foreground">/ Feedback</span>
        </Link>

        <nav className="ml-2 flex gap-1">
          {TABS.map((t) => (
            <span
              key={t.id}
              aria-disabled={!t.live}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors",
                activeTab === t.id && t.live
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground",
                !t.live && "cursor-not-allowed opacity-70",
              )}
            >
              {t.label}
              {!t.live ? (
                <span className="text-[10px] uppercase tracking-wider text-foreground-subtle">
                  Soon
                </span>
              ) : null}
            </span>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {session ? (
            <SubmitPostDialog boardId={boardId} />
          ) : (
            <>
              <Link
                href={signinHref}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Log in
              </Link>
              <Button asChild size="sm">
                <Link href={signinHref}>Submit feedback</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
