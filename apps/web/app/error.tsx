"use client"

import { Button } from "@workspace/ui/components/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

import { EmptyHint } from "@/components/common/empty-hint"
import { SITE_NAME } from "@/lib/seo"

// Global error boundary. Next.js renders this when a server component
// throws or a client error escapes a route segment without its own
// `error.tsx`. The marketing route group has its own error boundary
// that stays inside the marketing chrome — see `(marketing)/error.tsx`.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="grid min-h-svh place-items-center bg-background px-6 py-12 text-foreground">
      <EmptyHint
        icon={AlertTriangle}
        title="Something went wrong"
        description="We hit an unexpected error. Try again, or head back home."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" onClick={reset}>
              Try again
            </Button>
            <Button asChild>
              <Link href="/">{SITE_NAME} home</Link>
            </Button>
          </div>
        }
      />
    </div>
  )
}
