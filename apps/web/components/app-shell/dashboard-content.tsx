"use client"

import { Button } from "@workspace/ui/components/button"
import { FileText, Inbox, Layers, Map, Plus, Upload } from "lucide-react"
import Link from "next/link"

import { AdminPageShell } from "@/components/app-shell/admin-page-shell"
import { AppTopbar } from "@/components/app-shell/app-topbar"
import { MetricCard } from "@/components/app-shell/metric-card"
import { SectionCard } from "@/components/app-shell/section-card"
import { EmptyHint } from "@/components/common/empty-hint"
import { RecentPostRowSkeletonList } from "@/components/skeletons/dashboard-skeletons"
import {
  useDashboardBoardsQuery,
  useRecentPostsQuery,
} from "@/hooks/use-dashboard"
import { authClient } from "@/lib/auth-client"
import type { DashboardBoard, RecentPost } from "@/services/dashboard"

const BOARD_DOT_COLORS = [
  "var(--status-shipped-dot)",
  "var(--status-planned-dot)",
  "var(--status-progress-dot)",
  "var(--status-review-dot)",
]

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

function firstName(fullName: string): string {
  return fullName.split(" ")[0] ?? fullName
}

export function DashboardContent() {
  const boardsQuery = useDashboardBoardsQuery()
  const recentQuery = useRecentPostsQuery()
  const { data: session } = authClient.useSession()

  if (!session) return null

  const boards = boardsQuery.data?.boards ?? []
  const recentPosts = recentQuery.data?.posts ?? []
  const firstBoard = boards[0]
  const totalPosts = boards.reduce((acc, b) => acc + b.postCount, 0)
  const recentLoading = recentQuery.isPending && !recentQuery.data
  const boardsLoading = boardsQuery.isPending && !boardsQuery.data

  return (
    <AdminPageShell activeItem="dashboard">
      <AppTopbar
        title={`${greeting()}, ${firstName(session.user.name)}`}
        subtitle="Here's what's moving on your boards."
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled
            title="Coming soon"
            className="opacity-60"
          >
            <Plus className="size-4" />
            New board
          </Button>
        }
      />

      <div className="flex flex-col gap-5 px-8 py-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetricCard label="Total posts" value={totalPosts} />
          <MetricCard label="Total boards" value={boards.length} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
          <SectionCard title="Recent posts" flush>
            {recentLoading ? (
              <div className="px-4">
                <RecentPostRowSkeletonList />
              </div>
            ) : (
              <RecentPostsList posts={recentPosts} />
            )}
          </SectionCard>

          <div className="flex flex-col gap-4">
            <SectionCard title="Your boards">
              {boardsLoading ? (
                <div className="space-y-1.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-9 rounded-lg bg-muted/50 motion-safe:animate-pulse"
                      aria-hidden
                    />
                  ))}
                </div>
              ) : boards.length === 0 ? (
                <EmptyHint
                  variant="inline"
                  icon={Layers}
                  title="No boards yet"
                  description="Create one to start collecting feedback."
                  action={
                    <Button asChild size="sm">
                      <Link href="/onboarding/board">Create board</Link>
                    </Button>
                  }
                />
              ) : (
                <YourBoardsList boards={boards} />
              )}
            </SectionCard>
            <SectionCard title="Quick actions">
              <QuickActions firstBoard={firstBoard} />
            </SectionCard>
          </div>
        </div>
      </div>
    </AdminPageShell>
  )
}

function RecentPostsList({ posts }: { posts: RecentPost[] }) {
  if (posts.length === 0) {
    return (
      <div className="px-4">
        <EmptyHint
          variant="inline"
          icon={Inbox}
          title="Nothing here yet"
          description="When users submit feedback, the latest activity will land here."
        />
      </div>
    )
  }

  return (
    <ul>
      {posts.map((post, idx) => (
        <li
          key={post.id}
          className={
            idx < posts.length - 1 ? "border-b border-border-soft" : undefined
          }
        >
          <Link
            href={`/${post.workspaceSlug}/${post.boardSlug}`}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{post.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {post.boardName}
                {post.authorName ? (
                  <>
                    {" "}
                    · by{" "}
                    <span className="text-foreground">{post.authorName}</span>
                  </>
                ) : null}
              </div>
            </div>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
              {new Date(post.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function YourBoardsList({ boards }: { boards: DashboardBoard[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {boards.map((b, idx) => (
        <Link
          key={b.boardId}
          href={`/${b.workspaceSlug}/${b.boardSlug}`}
          className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-2.5 py-2 transition-colors hover:bg-muted"
        >
          <span
            aria-hidden="true"
            className="size-2 rounded-full"
            style={{
              background: BOARD_DOT_COLORS[idx % BOARD_DOT_COLORS.length],
            }}
          />
          <span className="flex-1 truncate text-sm font-medium">
            {b.boardName}
          </span>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {b.postCount}
          </span>
        </Link>
      ))}
    </div>
  )
}

function QuickActions({ firstBoard }: { firstBoard?: DashboardBoard }) {
  return (
    <div className="flex flex-col gap-1">
      <div
        aria-disabled="true"
        className="flex cursor-not-allowed items-center gap-2.5 px-1 py-1.5 text-sm text-muted-foreground opacity-60"
      >
        <Plus className="size-4" aria-hidden="true" />
        Create a new board
      </div>
      <div
        aria-disabled="true"
        className="flex cursor-not-allowed items-center gap-2.5 px-1 py-1.5 text-sm text-muted-foreground opacity-60"
      >
        <FileText className="size-4" aria-hidden="true" />
        Draft a changelog entry
      </div>
      <div
        aria-disabled="true"
        className="flex cursor-not-allowed items-center gap-2.5 px-1 py-1.5 text-sm text-muted-foreground opacity-60"
      >
        <Upload className="size-4" aria-hidden="true" />
        Import posts from CSV
      </div>
      {firstBoard ? (
        <Link
          href={`/${firstBoard.workspaceSlug}/${firstBoard.boardSlug}`}
          className="flex items-center gap-2.5 px-1 py-1.5 text-sm transition-colors hover:text-foreground"
        >
          <Map className="size-4" aria-hidden="true" />
          View public board
        </Link>
      ) : null}
    </div>
  )
}
