import { cn } from "@workspace/ui/lib/utils"
import { AlertTriangle, Info, Lightbulb } from "lucide-react"
import type { ReactNode } from "react"

// Drop-in `<Callout>` for MDX posts. Three variants — info (default),
// warn, tip — each with a matched icon. Kept deliberately small; if a
// post needs richer side-content, embed a full component instead.

const VARIANTS = {
  info: { icon: Info, classes: "border-border bg-card text-foreground" },
  warn: {
    icon: AlertTriangle,
    classes: "border-amber-300/40 bg-amber-50/40 text-foreground dark:bg-amber-950/20",
  },
  tip: {
    icon: Lightbulb,
    classes: "border-emerald-300/40 bg-emerald-50/40 text-foreground dark:bg-emerald-950/20",
  },
} as const

export function Callout({
  variant = "info",
  title,
  children,
}: {
  variant?: keyof typeof VARIANTS
  title?: string
  children: ReactNode
}) {
  const v = VARIANTS[variant]
  const Icon = v.icon
  return (
    <div className={cn("mt-6 flex gap-3 rounded-xl border p-4", v.classes)}>
      <Icon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <div className="flex flex-col gap-1.5 text-[14px] leading-relaxed">
        {title ? <div className="font-medium">{title}</div> : null}
        <div className="text-foreground/85 [&>p]:m-0">{children}</div>
      </div>
    </div>
  )
}
