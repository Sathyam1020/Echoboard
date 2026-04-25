import { FinalCTA } from "@/components/landing/final-cta"
import { Footer } from "@/components/landing/footer"
import { Hero } from "@/components/landing/hero"
import { MRRFeature } from "@/components/landing/mrr-feature"
import { Nav } from "@/components/landing/nav"
import { PainStrip } from "@/components/landing/pain-strip"
import { Pricing } from "@/components/landing/pricing"
import { ProductDemo } from "@/components/landing/product-demo"
import { TrustRow } from "@/components/landing/trust-row"
import { getSession } from "@/lib/get-session"

export default async function LandingPage() {
  // Session read server-side so the nav's auth slot can render the right
  // shell (avatar vs sign-in buttons) in the initial HTML — eliminates the
  // useSession() waterfall that delayed the LCP avatar by ~hydration cost.
  const session = await getSession()

  const initialAuth = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }
    : null

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <Nav initialAuth={initialAuth} />
      <main className="flex flex-col">
        <Hero />
        <PainStrip />
        <ProductDemo />
        <MRRFeature />
        <Pricing />
        <TrustRow />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
