"use client"

import { ArrowLeft, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PublicFooter } from "@/components/boards/public-footer"
import { PublicSidebar } from "@/components/boards/public-sidebar"
import { PublicTopBar } from "@/components/boards/public-top-bar"
import { MarkdownBody } from "@/components/changelog/markdown-body"
import { WrittenByCard } from "@/components/changelog/written-by-card"
import { PageEnter } from "@/components/common/page-enter"
import { useBoardBySlugQuery } from "@/hooks/queries/use-board-by-slug"
import {
  usePublicChangelogEntriesInfiniteQuery,
  usePublicChangelogQuery,
} from "@/hooks/queries/use-public-changelog"

export function PublicChangelogEntryContent({
  workspaceSlug,
  boardSlug,
  entryId,
}: {
  workspaceSlug: string
  boardSlug: string
  entryId: string
}) {
  const board = useBoardBySlugQuery({ workspaceSlug, boardSlug })
  const changelog = usePublicChangelogQuery(workspaceSlug)
  const entriesQuery = usePublicChangelogEntriesInfiniteQuery(workspaceSlug)
  if (!board.data || !changelog.data || !entriesQuery.data) return null

  // Entries are paginated; the SSR seeded the first page (which
  // contains this entry by construction since it was located there).
  const entries = entriesQuery.data.pages.flatMap((p) => p.entries)
  const entry = entries.find((e) => e.id === entryId)
  if (!entry) notFound()

  const when = entry.publishedAt ?? entry.createdAt
  const whenLabel = new Date(when).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const changelogHref = `/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(boardSlug)}/changelog`

  return (
    <div className="min-h-svh bg-[var(--surface-3)] text-foreground">
      <PublicTopBar
        workspaceName={board.data.workspace.name}
        workspaceSlug={board.data.workspace.slug}
        workspaceId={board.data.workspace.id}
        workspaceOwnerId={board.data.workspace.ownerId}
        boardSlug={board.data.board.slug}
        boardId={board.data.board.id}
        activeTab="changelog"
      />

      <PageEnter className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href={changelogHref}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to changelog
        </Link>

        <div className="flex flex-col-reverse gap-8 lg:flex-row">
          <PublicSidebar className="lg:w-60 lg:flex-shrink-0">
            <WrittenByCard author={entry.author} />
          </PublicSidebar>

          <main className="min-w-0 flex-1">
            <article className="rounded-xl border border-border bg-card p-6 sm:p-8">
              <time
                className="font-mono text-[12px] tabular-nums text-muted-foreground"
                dateTime={when}
              >
                {whenLabel}
              </time>
              <h1 className="mt-2 text-[28px] font-medium leading-tight -tracking-[0.02em] sm:text-[32px]">
                {entry.title}
              </h1>
              <div className="mt-6">
                <MarkdownBody>{entry.body}</MarkdownBody>
              </div>
              {entry.linkedPosts.length > 0 ? (
                <div className="mt-8 border-t border-border-soft pt-5">
                  <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Linked requests
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {entry.linkedPosts.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(p.boardSlug)}/${encodeURIComponent(p.id)}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <CheckCircle2
                            className="size-3 shrink-0"
                            style={{ color: "var(--status-shipped-dot)" }}
                            aria-hidden
                          />
                          {p.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          </main>
        </div>
      </PageEnter>

      <PublicFooter />
    </div>
  )
}
