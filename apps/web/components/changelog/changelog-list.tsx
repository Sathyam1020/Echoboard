import { CheckCircle2, Sparkles } from "lucide-react"
import Link from "next/link"

import { EmptyHint } from "@/components/common/empty-hint"

import { ChangelogRowActions } from "./changelog-row-actions"
import type { ChangelogListEntry } from "./types"

// Two layouts share one container:
//   - mobile: rows stack as title + meta + actions, no fixed-grid columns
//   - md+:    five-column grid (title / published / status / posts / actions)
// Switching at `md` keeps the table feel on tablet+ while letting mobile
// breathe.
const MD_GRID =
  "md:grid md:grid-cols-[minmax(0,2fr)_120px_140px_80px_40px]"

export function ChangelogList({ entries }: { entries: ChangelogListEntry[] }) {
  if (entries.length === 0) {
    return (
      <EmptyHint
        icon={Sparkles}
        title="No changelog entries yet"
        description="Ship something and tell your users about it."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div
        className={`hidden ${MD_GRID} items-center border-b border-border bg-muted/60 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground`}
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
        const dividerCls =
          idx < entries.length - 1 ? "border-b border-border-soft" : ""

        return (
          <div
            key={e.id}
            className={`flex flex-col gap-2 px-4 py-3 text-[13px] sm:px-5 sm:py-3.5 ${MD_GRID} md:items-center md:gap-0 ${dividerCls}`}
          >
            <div className="min-w-0 md:order-1">
              <Link
                href={`/dashboard/changelog/${e.id}/edit`}
                className="truncate font-medium hover:underline"
              >
                {e.title}
              </Link>
            </div>

            {/* Mobile meta row: status + posts + when, all inline */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-muted-foreground md:hidden">
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
              <span className="font-mono tabular-nums">{when}</span>
              <span className="font-mono tabular-nums">
                {e.linkedPostCount} post{e.linkedPostCount === 1 ? "" : "s"}
              </span>
            </div>

            {/* md+ columns */}
            <div className="hidden md:order-2 md:block font-mono text-[12px] tabular-nums text-muted-foreground">
              {when}
            </div>
            <div className="hidden md:order-3 md:block">
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
            <div className="hidden md:order-4 md:block font-mono tabular-nums text-muted-foreground">
              {e.linkedPostCount}
            </div>

            <div className="flex justify-end md:order-5">
              <ChangelogRowActions entryId={e.id} published={published} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

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
