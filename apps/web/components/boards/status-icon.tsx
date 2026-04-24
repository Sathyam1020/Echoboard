import { cn } from "@workspace/ui/lib/utils"
import {
  CheckCircle2,
  CircleDashed,
  Clock,
  LoaderCircle,
} from "lucide-react"
import type { ComponentType, SVGProps } from "react"

export type StatusKey = "review" | "planned" | "progress" | "shipped"

export const STATUS_LABEL: Record<StatusKey, string> = {
  review: "Under review",
  planned: "Planned",
  progress: "In progress",
  shipped: "Shipped",
}

export const STATUS_ICON: Record<
  StatusKey,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  review: CircleDashed,
  planned: Clock,
  progress: LoaderCircle,
  shipped: CheckCircle2,
}

// Colour the icon itself (not the badge text) with the status-*-dot token
// via inline style, so the icon pops even when the label sits on the same
// text color.
const DOT_COLOR: Record<StatusKey, string> = {
  review: "var(--status-review-dot)",
  planned: "var(--status-planned-dot)",
  progress: "var(--status-progress-dot)",
  shipped: "var(--status-shipped-dot)",
}

export function isStatusKey(value: string): value is StatusKey {
  return value === "review" || value === "planned" || value === "progress" || value === "shipped"
}

export function StatusIcon({
  status,
  size = 14,
  className,
  strokeWidth = 2,
}: {
  status: StatusKey
  size?: number
  className?: string
  strokeWidth?: number
}) {
  const Icon = STATUS_ICON[status]
  return (
    <Icon
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      aria-hidden
      className={cn("shrink-0", className)}
      style={{ color: DOT_COLOR[status] }}
    />
  )
}

// Convenience: badge = icon + label in a single element.
export function StatusBadge({
  status,
  className,
}: {
  status: StatusKey
  className?: string
}) {
  return (
    <span className={cn("status-badge", `status-${status}`, className)}>
      <StatusIcon status={status} size={12} />
      {STATUS_LABEL[status]}
    </span>
  )
}
