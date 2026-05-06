import { cn } from "@workspace/ui/lib/utils"

// Default = pulse (existing behavior, gated by motion-safe so reduced-
// motion users get a still placeholder).
//
// `shimmer` opt-in adds a left-to-right highlight overlay on top of the
// muted bg — the standard "loading bar sliding across" pattern. Single
// keyframe defined in globals.css (`@keyframes shimmer`).
function Skeleton({
  className,
  shimmer = false,
  ...props
}: React.ComponentProps<"div"> & { shimmer?: boolean }) {
  if (!shimmer) {
    return (
      <div
        data-slot="skeleton"
        className={cn(
          "rounded-md bg-muted motion-safe:animate-pulse",
          className,
        )}
        {...props}
      />
    )
  }
  return (
    <div
      data-slot="skeleton"
      className={cn("relative overflow-hidden rounded-md bg-muted", className)}
      {...props}
    >
      <div className="motion-safe:animate-[shimmer_1.5s_infinite] absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/8 to-transparent" />
    </div>
  )
}

export { Skeleton }
