import { FinalCTA } from "@/components/landing/final-cta"
import { Footer } from "@/components/landing/footer"
import { Hero } from "@/components/landing/hero"
import { MRRFeature } from "@/components/landing/mrr-feature"
import { Nav } from "@/components/landing/nav"
import { PainStrip } from "@/components/landing/pain-strip"
import { Pricing } from "@/components/landing/pricing"
import { ProductDemo } from "@/components/landing/product-demo"
import { TrustRow } from "@/components/landing/trust-row"

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <Nav />
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
