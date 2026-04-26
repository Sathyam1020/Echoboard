"use client"

import { Button } from "@workspace/ui/components/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

import { EmptyHint } from "@/components/common/empty-hint"

// Error boundary for the marketing route group. Stays inside the
// marketing layout (header + footer) instead of the full-page global
// boundary so visitors don't lose context when something fails.
export default function MarketingError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="py-16">
      <EmptyHint
        icon={AlertTriangle}
        title="Something went wrong"
        description="We hit an unexpected error loading this page. Try again, or take a different route."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" onClick={reset}>
              Try again
            </Button>
            <Button asChild variant="outline">
              <Link href="/blog">Read the blog</Link>
            </Button>
            <Button asChild>
              <Link href="/">Home</Link>
            </Button>
          </div>
        }
      />
    </div>
  )
}
