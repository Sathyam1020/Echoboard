import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

import { MarkdownBody } from "./markdown-body"
import type { PublicChangelogEntry } from "./types"

export function PublicEntry({
  entry,
  workspaceSlug,
}: {
  entry: PublicChangelogEntry
  workspaceSlug: string
}) {
  const when = entry.publishedAt ?? entry.createdAt
  const whenLabel = new Date(when).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <article className="changelog-entry flex gap-6 border-b border-border-soft py-8 last:border-b-0">
      <div className="shrink-0 pt-1 text-right sm:w-[120px]">
        <time
          className="block font-mono text-[12px] tabular-nums text-muted-foreground"
          dateTime={when}
        >
          {whenLabel}
        </time>
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-[18px] font-medium -tracking-[0.015em]">
          {entry.title}
        </h2>
        <div className="mt-3">
          <MarkdownBody>{entry.body}</MarkdownBody>
        </div>
        {entry.linkedPosts.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {entry.linkedPosts.map((p) => (
              <Link
                key={p.id}
                href={`/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(p.boardSlug)}/${encodeURIComponent(p.id)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[12px] text-muted-foreground hover:text-foreground"
              >
                <CheckCircle2
                  className="size-3 shrink-0"
                  style={{ color: "var(--status-shipped-dot)" }}
                  aria-hidden
                />
                {p.title}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}
