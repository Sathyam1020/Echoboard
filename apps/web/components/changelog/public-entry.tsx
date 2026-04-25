import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

import type { PublicChangelogEntry } from "./types"

// Strips common markdown syntax so the card preview renders as plain
// text. Whole-card link can't have nested links/images, and prose
// blocks compete for the visitor's eye on a list. Plain text + line
// clamp keeps the card scannable.
function stripMarkdown(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → text
    .replace(/^>\s?/gm, "") // blockquote markers
    .replace(/^[-*+]\s+/gm, "") // bullet list markers
    .replace(/^\d+\.\s+/gm, "") // ordered list markers
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\*([^*]+)\*/g, "$1") // italic
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1") // strikethrough
    .replace(/\s+/g, " ")
    .trim()
}

export function PublicEntry({
  entry,
  workspaceSlug,
  boardSlug,
}: {
  entry: PublicChangelogEntry
  workspaceSlug: string
  /** Board slug used to build the entry detail URL. */
  boardSlug: string
}) {
  const when = entry.publishedAt ?? entry.createdAt
  const whenLabel = new Date(when).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
  const preview = stripMarkdown(entry.body)
  const href = `/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(boardSlug)}/changelog/${encodeURIComponent(entry.id)}`

  // `.changelog-entry` provides the timeline (left rule + dot ::before).
  // The whole row is a Link — we add a transparent rounded "hit area" to
  // the right of the timeline rule so hover only highlights the content
  // pane, never the line itself (which would visually break continuity).
  return (
    <Link
      href={href}
      className="changelog-entry group flex gap-6 border-b border-border-soft py-8 transition-colors last:border-b-0 hover:bg-card/40"
    >
      <div className="shrink-0 pt-1 text-right sm:w-[120px]">
        <time
          className="block font-mono text-[12px] tabular-nums text-muted-foreground"
          dateTime={when}
        >
          {whenLabel}
        </time>
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="line-clamp-1 text-[18px] font-medium -tracking-[0.015em] transition-colors group-hover:text-foreground">
          {entry.title}
        </h2>
        {preview ? (
          <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-muted-foreground">
            {preview}
          </p>
        ) : null}
        {entry.linkedPosts.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
            <CheckCircle2
              className="size-3 shrink-0"
              style={{ color: "var(--status-shipped-dot)" }}
              aria-hidden
            />
            <span>
              {entry.linkedPosts.length}{" "}
              {entry.linkedPosts.length === 1
                ? "linked request"
                : "linked requests"}
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  )
}
