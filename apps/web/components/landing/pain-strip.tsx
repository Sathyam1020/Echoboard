import { Check, X } from "lucide-react"

import { FadeIn } from "./fade-in"

const PAINS = [
  {
    pain: "Canny charges you more when your users engage more",
    solution:
      "Unlimited users on every plan. Your bill never grows with engagement.",
  },
  {
    pain: "50 votes from free users outweigh 3 enterprise accounts",
    solution:
      "See the MRR behind every vote. Prioritize by revenue, not noise.",
  },
  {
    pain: "Feedback scattered across Slack, email, and support tickets",
    solution:
      "One board your whole team and all your users share as the single source of truth.",
  },
] as const

export function PainStrip() {
  return (
    <section
      id="features"
      className="border-y border-border bg-secondary px-6 py-16"
    >
      <div className="mx-auto max-w-5xl">
        <FadeIn>
          <p className="mb-8 text-center text-xs tracking-widest text-muted-foreground/60 uppercase">
            Why teams switch
          </p>
        </FadeIn>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PAINS.map((item, i) => (
            <FadeIn key={item.pain} delay={i * 60} className="h-full">
              <div className="flex h-full flex-col gap-4 rounded-xl border border-border/60 bg-card p-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                    <X className="size-3 text-destructive" />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground line-through decoration-muted-foreground/30">
                    {item.pain}
                  </p>
                </div>

                <div className="border-t border-border/50" />

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="size-3 text-primary" />
                  </div>
                  <p className="text-sm leading-relaxed font-medium text-foreground">
                    {item.solution}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
