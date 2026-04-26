// Three-dot wave used for "Sara is typing…" affordances. CSS-only
// animation keyed on @keyframes typing-dot in globals.css. Wrapped in
// aria-live so screen readers announce typing without spamming.

import { cn } from "@workspace/ui/lib/utils"

export function TypingDots({
  label,
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 text-[12px] text-muted-foreground",
        className,
      )}
    >
      <span className="inline-flex items-center gap-[3px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden
            className="size-1.5 rounded-full bg-muted-foreground/70 motion-safe:animate-[typing-dot_1.2s_ease-in-out_infinite]"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      {label ? <span>{label}</span> : null}
    </div>
  )
}
