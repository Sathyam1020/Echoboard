import { cn } from "@workspace/ui/lib/utils"

export function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-6 flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const reached = i + 1 <= step
        const current = i + 1 === step
        return (
          <div
            key={i}
            className={cn(
              "h-1 rounded-full transition-colors",
              current ? "flex-[2]" : "flex-1",
              reached ? "bg-primary" : "bg-muted",
            )}
          />
        )
      })}
      <span className="ml-2 font-mono text-[11px] tabular-nums text-muted-foreground">
        Step {step} of {total}
      </span>
    </div>
  )
}
