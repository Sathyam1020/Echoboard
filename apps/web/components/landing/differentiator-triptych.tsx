import { Layers, MessageSquarePlus, Zap, type LucideIcon } from "lucide-react"

import { FadeIn } from "./fade-in"

// Three feature cards under the product demo. These are the headline
// differentiators we lean on across every SEO comparison page — the
// landing should mirror them so paid + organic flows tell the same
// story. Stays standalone (no marketing-route links) per the revamp
// scope — links can land later once the user reviews.
type Card = {
  icon: LucideIcon
  title: string
  description: string
}

const CARDS: Card[] = [
  {
    icon: MessageSquarePlus,
    title: "No-login feedback widget",
    description:
      "Drop a script tag. Visitors submit with just an email — no account, no signup flow, no friction.",
  },
  {
    icon: Zap,
    title: "Flat pricing forever",
    description:
      "$0 free, $29/mo Pro. Your bill doesn't change as your audience grows from 100 to 100,000.",
  },
  {
    icon: Layers,
    title: "All-in-one workspace",
    description:
      "Boards, public roadmap, changelog. One tool. One source of truth.",
  },
]

export function DifferentiatorTriptych() {
  return (
    <section className="px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <div className="mb-12 max-w-2xl">
            <p className="text-xs tracking-widest text-muted-foreground/60 uppercase">
              What makes us different
            </p>
            <h2 className="mt-3 text-2xl font-medium tracking-tight -tracking-[0.01em] sm:text-3xl">
              Built for teams who don&apos;t want to count seats
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Three things every other feedback tool gets wrong.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map(({ icon: Icon, title, description }, i) => (
            <FadeIn key={title} delay={i * 80} className="h-full">
              <article className="flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-6">
                <div
                  aria-hidden
                  className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground"
                >
                  <Icon className="size-4" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-[16px] font-medium -tracking-[0.005em]">
                    {title}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
