import type { ReactNode } from "react"

import { MarketingFooter } from "@/components/marketing/marketing-footer"
import { MarketingHeader } from "@/components/marketing/marketing-header"

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MarketingHeader />
      <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
        {children}
      </main>
      <MarketingFooter />
    </>
  )
}
