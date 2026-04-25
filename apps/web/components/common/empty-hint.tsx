import { cn } from "@workspace/ui/lib/utils"
import { type LucideIcon } from "lucide-react"
import { type ReactNode } from "react"

// Shared empty-state primitive. Every "No X yet / No matching Y" surface in
// the app routes through this so the visual treatment stays consistent — same
// border, padding, spacing, and type ramp.
//
// Two flavours via `variant`:
//   - "card" (default): solid border on a card-coloured surface. Use for
//     full-page empty lists where the empty state is the only thing on screen.
//   - "soft": dashed border on a tinted surface. Use for secondary/inline
//     empty states inside a parent card (comments, roadmap columns).
export function EmptyHint({
  icon: Icon,
  title,
  description,
  action,
  variant = "card",
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  variant?: "card" | "soft"
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl px-6 py-10 text-center sm:py-12",
        variant === "card"
          ? "border border-border bg-card"
          : "border border-dashed border-border bg-card/40",
        className,
      )}
    >
      {Icon ? (
        <div
          aria-hidden
          className="flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
        >
          <Icon className="size-4" />
        </div>
      ) : null}
      <div className="flex max-w-sm flex-col items-center gap-1.5">
        <p className="text-[13.5px] font-medium text-foreground">{title}</p>
        {description ? (
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
