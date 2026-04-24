import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

import { ChangelogRowActions } from "./changelog-row-actions"
import type { ChangelogListEntry } from "./types"

const GRID = "grid grid-cols-[minmax(0,2fr)_120px_140px_80px_40px]"

export function ChangelogList({ entries }: { entries: ChangelogListEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
        <p className="text-sm font-medium">No changelog entries yet</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Ship something and tell your users about it.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div
        className={`${GRID} items-center border-b border-border bg-muted/60 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground`}
      >
        <div>Title</div>
        <div>Published</div>
        <div>Status</div>
        <div>Posts</div>
        <div />
      </div>
      {entries.map((e, idx) => {
        const published = Boolean(e.publishedAt)
        const when = e.publishedAt
          ? new Date(e.publishedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "—"
        return (
          <div
            key={e.id}
            className={
              idx < entries.length - 1
                ? `${GRID} items-center border-b border-border-soft px-5 py-3.5 text-[13px]`
                : `${GRID} items-center px-5 py-3.5 text-[13px]`
            }
          >
            <div className="min-w-0">
              <Link
                href={`/dashboard/changelog/${e.id}/edit`}
                className="truncate font-medium hover:underline"
              >
                {e.title}
              </Link>
            </div>
            <div className="font-mono text-[12px] tabular-nums text-muted-foreground">
              {when}
            </div>
            <div>
              {published ? (
                <span className="status-badge status-shipped !text-[11px]">
                  <CheckCircle2
                    className="size-3 shrink-0"
                    style={{ color: "var(--status-shipped-dot)" }}
                    aria-hidden
                  />
                  Published
                </span>
              ) : (
                <DraftBadge />
              )}
            </div>
            <div className="font-mono tabular-nums text-muted-foreground">
              {e.linkedPostCount}
            </div>
            <div className="flex justify-end">
              <ChangelogRowActions entryId={e.id} published={published} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Neutral-grey badge for drafts. The four status-* classes are all coloured
// (review/planned/progress/shipped) — "Draft" is its own state, so we render
// it flat on surface-2 instead of using any of those.
function DraftBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      <span
        aria-hidden
        className="size-[5px] rounded-full bg-muted-foreground"
      />
      Draft
    </span>
  )
}
