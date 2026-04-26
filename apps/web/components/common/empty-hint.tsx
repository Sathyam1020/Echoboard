import { cn } from "@workspace/ui/lib/utils"
import { type LucideIcon } from "lucide-react"
import { type ReactNode } from "react"

// Shared empty-state primitive. Every "No X yet / No matching Y"
// surface in the app routes through this so visual treatment stays
// consistent — same border, padding, animation, type ramp.
//
// Variants:
//   - "card"   : solid border on a card-coloured surface. Full-page
//                empty lists where the empty state is the focal point.
//   - "soft"   : dashed border on a tinted surface. Secondary / inline
//                empties inside a parent card (e.g. comments thread).
//   - "inline" : no chrome at all. For tight spots like roadmap-column
//                cells where the wrapper itself supplies the border.
//
// The icon is wrapped in a halo + ring that gently animates. Users
// with `prefers-reduced-motion: reduce` see a still icon.
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
  variant?: "card" | "soft" | "inline"
  className?: string
}) {
  const compact = variant === "inline"

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 text-center",
        variant === "card" &&
          "rounded-xl border border-border bg-card px-6 py-10 sm:py-12",
        variant === "soft" &&
          "rounded-xl border border-dashed border-border bg-card/40 px-6 py-10 sm:py-12",
        variant === "inline" && "px-2 py-6",
        className,
      )}
    >
      {Icon ? <EmptyHintIcon Icon={Icon} compact={compact} /> : null}
      <div className="flex max-w-sm flex-col items-center gap-1.5">
        <p
          className={cn(
            "font-medium text-foreground",
            compact ? "text-[12.5px]" : "text-[13.5px]",
          )}
        >
          {title}
        </p>
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

// Animated icon block: a soft outer ring expands and fades, a softer
// halo pulses behind, and the inner card carries the lucide icon with
// a gentle vertical float. Each layer uses a different duration so
// they don't beat in lockstep.
function EmptyHintIcon({
  Icon,
  compact,
}: {
  Icon: LucideIcon
  compact: boolean
}) {
  const size = compact ? "size-9" : "size-12"
  const innerSize = compact ? "size-4" : "size-5"

  return (
    <div aria-hidden className="relative flex items-center justify-center">
      {/* Outer ring — expands outward, fades to transparent */}
      <span
        className={cn(
          "absolute rounded-full border border-border",
          size,
          "motion-safe:animate-[empty-ring_2.8s_ease-out_infinite]",
        )}
      />
      {/* Halo pulse — sits at z-1 behind the icon container */}
      <span
        className={cn(
          "absolute rounded-full bg-muted",
          size,
          "motion-safe:animate-[empty-halo_3.2s_ease-in-out_infinite]",
        )}
      />
      {/* Icon container — gently floats up/down */}
      <div
        className={cn(
          "relative grid place-items-center rounded-full border border-border bg-card text-muted-foreground",
          size,
          "motion-safe:animate-[empty-float_4s_ease-in-out_infinite]",
        )}
      >
        <Icon className={innerSize} />
      </div>
    </div>
  )
}
