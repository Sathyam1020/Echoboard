import { DifferentiatorTriptych } from "@/components/landing/differentiator-triptych"
import { FinalCTA } from "@/components/landing/final-cta"
import { Footer } from "@/components/landing/footer"
import { Hero } from "@/components/landing/hero"
import { LandingFaq } from "@/components/landing/landing-faq"
import { MRRFeature } from "@/components/landing/mrr-feature"
import { Nav } from "@/components/landing/nav"
import { PainStrip } from "@/components/landing/pain-strip"
import { Pricing } from "@/components/landing/pricing"
import { ProductDemo } from "@/components/landing/product-demo"
import {
  JsonLd,
  organizationSchema,
  softwareApplicationSchema,
} from "@/components/seo/json-ld"
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
      {/* Structured data for the home page. Two schemas: Organization
          establishes the brand entity for Google's Knowledge Graph;
          SoftwareApplication classifies us as an indexable product so we can
          win software-category SERP features. */}
      <JsonLd data={organizationSchema()} />
      <JsonLd data={softwareApplicationSchema()} />

      {/* Landing keeps its own Nav + Footer — deliberately not wired to
          the marketing chrome (`MarketingHeader` / `MarketingFooter`)
          until the user reviews the revamp. */}
      <Nav initialAuth={initialAuth} />
      <main className="flex flex-col">
        <Hero />
        <PainStrip />
        <ProductDemo />
        <DifferentiatorTriptych />
        <MRRFeature />
        <Pricing />
        <LandingFaq />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
