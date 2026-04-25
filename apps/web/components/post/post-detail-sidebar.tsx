import { cn } from "@workspace/ui/lib/utils"

import {
  isStatusKey,
  STATUS_LABEL,
  StatusIcon,
} from "@/components/boards/status-icon"
import type { PostDetail } from "@/components/boards/types"

// Sidebar card shown next to the post body. Three rows of post metadata —
// matches the visual rhythm of the BoardsListCard used on the public
// board page so the chrome feels consistent when navigating between
// list view and detail view.
export function PostDetailSidebar({
  post,
  className,
}: {
  post: PostDetail
  className?: string
}) {
  const statusKey = isStatusKey(post.status) ? post.status : "review"
  const statusLabel = STATUS_LABEL[statusKey] ?? "Under review"
  const posted = new Date(post.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-background p-4",
        className,
      )}
    >
      <dl className="flex flex-col gap-3">
        <Row label="Status">
          <span className="flex items-center gap-1.5">
            <StatusIcon status={statusKey} size={14} />
            <span className="font-medium">{statusLabel}</span>
          </span>
        </Row>
        <Row label="Board">
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full bg-emerald-500"
              aria-hidden
            />
            <span className="font-medium">{post.board.name}</span>
          </span>
        </Row>
        <Row label="Posted">
          <span className="font-mono tabular-nums text-foreground">
            {posted}
          </span>
        </Row>
      </dl>
    </div>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="text-[13px] text-foreground">{children}</dd>
    </div>
  )
}
