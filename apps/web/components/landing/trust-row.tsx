import { Check } from "lucide-react"

import { FadeIn } from "./fade-in"

const BADGES = [
  "Free forever tier",
  "No tracked-user pricing",
  "Set up in 2 minutes",
]

export function TrustRow() {
  return (
    <section className="border-y border-border bg-secondary/40 px-6 py-14">
      <div className="mx-auto max-w-4xl text-center">
        <FadeIn>
          <p className="text-sm text-muted-foreground">
            Built by an indie founder. Open roadmap. No VC pressure to raise
            prices.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {BADGES.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Check className="size-3.5 text-primary" />
                {b}
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
