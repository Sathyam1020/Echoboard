"use client"

import { Button } from "@workspace/ui/components/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

// Route-scoped error boundary for /dashboard/support. Catches a
// malformed WebSocket event, a borked cache patch, or a render-time
// crash inside the thread without taking the whole dashboard down.
// Logs to the console so the dev sees the original; production wires
// a real reporter at the app/error.tsx layer.
export default function SupportError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[support] page crashed", error)
  }, [error])

  return (
    <div className="flex min-h-svh items-center justify-center px-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
          <AlertTriangle className="size-5" aria-hidden />
        </div>
        <h1 className="text-lg font-medium">Inbox hit an error</h1>
        <p className="text-[13.5px] text-muted-foreground">
          Something went wrong rendering this page. Try again — if it
          keeps crashing, let us know what happened right before.
        </p>
        <div className="flex items-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
