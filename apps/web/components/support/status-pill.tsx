import { cn } from "@workspace/ui/lib/utils"

import type { ConversationStatus } from "./types"

const STYLES: Record<ConversationStatus, string> = {
  open: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  pending:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  resolved:
    "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300",
}

const LABELS: Record<ConversationStatus, string> = {
  open: "Open",
  pending: "Pending",
  resolved: "Resolved",
}

export function StatusPill({
  status,
  className,
}: {
  status: ConversationStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider transition-colors",
        STYLES[status],
        className,
      )}
    >
      {LABELS[status]}
    </span>
  )
}
