import { Button } from "@workspace/ui/components/button"
import { FileText, Map, Plus, Upload } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell/app-shell"
import { AppSidebar } from "@/components/app-shell/app-sidebar"
import { AppTopbar } from "@/components/app-shell/app-topbar"
import { MetricCard } from "@/components/app-shell/metric-card"
import { SectionCard } from "@/components/app-shell/section-card"
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

type RecentPost = {
  id: string
  title: string
  description: string
  status: string
  createdAt: string
  authorName: string | null
  boardName: string
  boardSlug: string
  workspaceSlug: string
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

function firstName(fullName: string): string {
  return fullName.split(" ")[0] ?? fullName
}

const BOARD_DOT_COLORS = [
  "var(--status-shipped-dot)",
  "var(--status-planned-dot)",
  "var(--status-progress-dot)",
  "var(--status-review-dot)",
]

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/signin")

  const [{ boards }, { posts: recentPosts }] = await Promise.all([
    serverApi.get<{ boards: DashboardBoard[] }>("/api/dashboard/boards"),
    serverApi.get<{ posts: RecentPost[] }>("/api/dashboard/recent-posts"),
  ])

  const workspaceName = boards[0]?.workspaceName ?? "Workspace"
  const firstBoard = boards[0]
  const totalPosts = boards.reduce((acc, b) => acc + b.postCount, 0)

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
          activeItem="dashboard"
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
        />
      }
    >
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
            <RecentPostsList posts={recentPosts} />
          </SectionCard>

          <div className="flex flex-col gap-4">
            <SectionCard title="Your boards">
              <YourBoardsList boards={boards} />
            </SectionCard>
            <SectionCard title="Quick actions">
              <QuickActions firstBoard={firstBoard} />
            </SectionCard>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function RecentPostsList({ posts }: { posts: RecentPost[] }) {
  if (posts.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        No posts yet.
      </p>
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
