import { Globe, Lock } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

// v1: only `public` is selectable. The form always submits visibility="public".
// The private card is rendered disabled with a "Coming soon" tag so the UI
// matches the design without offering a broken option.
export function VisibilityRadio() {
  return (
    <div role="radiogroup" className="flex flex-col gap-2">
      <OptionCard
        icon={<Globe className="size-3.5" />}
        label="Public"
        description="Anyone with the link can vote. Best for most teams."
        selected
      />
      <OptionCard
        icon={<Lock className="size-3.5" />}
        label="Private"
        description="Email invite only. Use for internal or beta."
        disabled
      />
    </div>
  )
}

function OptionCard({
  icon,
  label,
  description,
  selected,
  disabled,
}: {
  icon: ReactNode
  label: string
  description: string
  selected?: boolean
  disabled?: boolean
}) {
  return (
    <div
      role="radio"
      aria-checked={selected ?? false}
      aria-disabled={disabled ?? false}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 transition-colors",
        selected ? "border-primary bg-accent" : "border-border",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:bg-muted/40",
      )}
    >
      <span
        className={cn(
          "mt-1 flex size-4 items-center justify-center rounded-full border-[1.5px]",
          selected ? "border-primary bg-primary" : "border-border",
        )}
        aria-hidden
      >
        {selected ? (
          <span className="size-1.5 rounded-full bg-primary-foreground" />
        ) : null}
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground">{icon}</span>
          <span>{label}</span>
          {disabled ? (
            <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
              Coming soon
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
