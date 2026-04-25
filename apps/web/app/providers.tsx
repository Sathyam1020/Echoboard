"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "@workspace/ui/components/sonner"
import { MotionConfig } from "motion/react"
import type { ReactNode } from "react"

import { getQueryClient } from "@/lib/query/query-client"
import { StoreProvider } from "@/stores/store-provider"

export function Providers({ children }: { children: ReactNode }) {
  // getQueryClient returns a fresh client on the server (we land here only
  // through SSR) and the same singleton on every browser render.
  const client = getQueryClient()
  return (
    <QueryClientProvider client={client}>
      {/* `reducedMotion="user"` makes every Motion animation in the tree
          honor `prefers-reduced-motion: reduce` automatically — no per-call
          guards needed downstream. */}
      <MotionConfig reducedMotion="user">
        <StoreProvider>{children}</StoreProvider>
      </MotionConfig>
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          // Subtler than sonner's default — matches our flat surfaces.
          className: "!shadow-none",
        }}
      />
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      ) : null}
    </QueryClientProvider>
  )
}
