import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

// Repeatable CTA block dropped at the bottom of every marketing page.
// Two variants: "dark" (full-width, neutral-800 bg, white text — used as
// the primary closer) and "light" (card surface, used inline mid-page).
export function CtaSection({
  variant = "dark",
  headline = "Stop paying per tracked user",
  description = "Free forever for unlimited users. No credit card. Set up in two minutes.",
  primaryHref = "/signup",
  primaryLabel = "Start free →",
  secondaryHref = "/#demo",
  secondaryLabel = "See how it works",
}: {
  variant?: "dark" | "light"
  headline?: string
  description?: string
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
}) {
  return (
    <section
      className={cn(
        "rounded-2xl px-8 py-12 text-center sm:px-12 sm:py-16",
        variant === "dark"
          ? "bg-foreground text-background"
          : "border border-border bg-card",
      )}
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3">
        <h2
          className={cn(
            "text-[28px] font-medium leading-tight -tracking-[0.015em] sm:text-[32px]",
            variant === "dark" ? "text-background" : "text-foreground",
          )}
        >
          {headline}
        </h2>
        <p
          className={cn(
            "max-w-lg text-[14px] leading-relaxed sm:text-[15px]",
            variant === "dark"
              ? "text-background/70"
              : "text-muted-foreground",
          )}
        >
          {description}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            variant={variant === "dark" ? "secondary" : "default"}
            className="shadow-none"
          >
            <Link href={primaryHref}>
              {primaryLabel}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant={variant === "dark" ? "ghost" : "outline"}
            className={cn(
              "shadow-none",
              variant === "dark" && "text-background hover:bg-background/10",
            )}
          >
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
