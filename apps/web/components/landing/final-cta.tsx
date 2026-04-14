import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

import { FadeIn } from "./fade-in"

export function FinalCTA() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <FadeIn>
          <h2 className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">
            Your users have opinions. Start listening.
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Free for unlimited users. Takes{" "}
            <span className="font-mono tabular-nums">2</span> minutes to set up.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Button asChild size="lg" className="px-8 text-base shadow-none">
              <Link href="/signup">Create your board →</Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              No credit card required
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
