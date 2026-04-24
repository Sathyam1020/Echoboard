import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { CheckCircle2 } from "lucide-react"

const CHANGELOG_ENTRIES = [
  {
    date: "Apr 12, 2026",
    title: "Webhooks on status change",
    body: "Subscribe to post.status_changed and pipe updates anywhere.",
  },
  {
    date: "Apr 4, 2026",
    title: "Saved filter views",
    body: "Pin a filter combination and share the URL with teammates.",
  },
  {
    date: "Mar 27, 2026",
    title: "MRR-weighted sort",
    body: "Rank feedback by total MRR of voters, not just vote count.",
  },
]

export function ChangelogMockup() {
  return (
    <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-start">
      <div className="space-y-5 pl-1">
        {CHANGELOG_ENTRIES.map((e) => (
          <article key={e.title} className="changelog-entry !pb-0">
            <div className="flex items-center gap-2">
              <time className="font-mono text-[11px] text-muted-foreground/60">
                {e.date}
              </time>
              <span className="status-badge status-shipped !text-[11px]">
                <CheckCircle2
                  className="size-3 shrink-0"
                  style={{ color: "var(--status-shipped-dot)" }}
                  aria-hidden
                />
                Shipped
              </span>
            </div>
            <h3 className="mt-1 text-[13px] font-medium text-foreground">
              {e.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground/80">
              {e.body}
            </p>
          </article>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-muted/40 p-4 sm:w-56">
        <p className="text-sm font-medium">Subscribe to updates</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Get a monthly digest of what shipped.
        </p>
        <Input
          type="email"
          placeholder="you@company.com"
          className="mt-3 h-8 text-xs"
          readOnly
          aria-readonly="true"
          tabIndex={-1}
        />
        <Button className="mt-2 w-full shadow-none" size="sm">
          Subscribe
        </Button>
      </div>
    </div>
  )
}
