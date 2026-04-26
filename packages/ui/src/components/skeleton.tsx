import { cn } from "@workspace/ui/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // `motion-safe:` gating so users with reduced-motion get a still
      // placeholder rather than a pulsing distraction.
      className={cn(
        "rounded-md bg-muted motion-safe:animate-pulse",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
