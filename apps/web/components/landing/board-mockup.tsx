import { ChevronUp, MessageSquare } from "lucide-react"

import { StatusIcon } from "@/components/boards/status-icon"
import { cn } from "@workspace/ui/lib/utils"

const BOARD_POSTS = [
  {
    title: "Slack integration for new feedback notifications",
    description:
      "Pipe new posts into a chosen channel so the team sees them without opening the dashboard.",
    votes: 184,
    voted: true,
    status: "progress" as const,
    statusLabel: "In progress",
    mrr: "$12,400/mo",
    author: "Priya Shah",
    comments: 23,
  },
  {
    title: "Custom domain support on the public board",
    description:
      "Host the feedback board at feedback.ourcompany.com instead of the default subdomain.",
    votes: 142,
    status: "planned" as const,
    statusLabel: "Planned",
    mrr: "$8,200/mo",
    author: "Marcus Lin",
    comments: 17,
  },
  {
    title: "Bulk-merge duplicate posts",
    description:
      "Merge three variants of the same idea and keep all the votes on a single canonical post.",
    votes: 96,
    voted: true,
    status: "review" as const,
    statusLabel: "Under review",
    mrr: "$4,200/mo",
    author: "Hana Okabe",
    comments: 9,
  },
  {
    title: "Webhooks on status change",
    description:
      "Fire a webhook whenever a post moves columns so we can sync to Linear automatically.",
    votes: 58,
    status: "shipped" as const,
    statusLabel: "Shipped",
    mrr: "$6,100/mo",
    author: "Sara Bennet",
    comments: 12,
  },
  {
    title: "Roadmap embed for marketing site",
    description:
      "An iframe-able roadmap view we can drop into our /product page without auth friction.",
    votes: 44,
    status: "review" as const,
    statusLabel: "Under review",
    mrr: "$2,800/mo",
    author: "Diego Alvarez",
    comments: 4,
  },
]

export function BoardMockup() {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="filter-pill">Most voted</span>
        <span className="filter-pill filter-active">By MRR</span>
        <span className="filter-pill">Newest</span>
        <span className="filter-pill">Trending</span>
      </div>
      <div className="flex flex-col gap-2">
        {BOARD_POSTS.map((p) => (
          <article key={p.title} className="feedback-card !gap-4">
            <div className={cn("vote-btn", p.voted && "vote-active")}>
              <ChevronUp className="size-4" />
              <span className="font-mono tabular-nums">{p.votes}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-medium text-foreground">
                {p.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                {p.description}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground/80">
                <span
                  className={cn(
                    "status-badge !text-[11px]",
                    `status-${p.status}`,
                  )}
                >
                  <StatusIcon status={p.status} size={12} />
                  {p.statusLabel}
                </span>
                <span className="mrr-tag" data-mono>
                  {p.mrr}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-muted-foreground/70">{p.author}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground/70">
                  <MessageSquare className="size-3" />
                  <span className="font-mono tabular-nums">{p.comments}</span>
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
