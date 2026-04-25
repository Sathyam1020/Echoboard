// QueryClient factory that does the right thing on server and browser.
//
// Server: a fresh QueryClient per request (per Server Component render).
// Reusing across requests would leak data between visitors.
//
// Browser: one singleton for the page lifetime.
import { QueryClient, defaultShouldDehydrateQuery } from "@tanstack/react-query"

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Match what the SSR docs recommend — keeps client from immediately
        // refetching everything we just rendered on the server.
        staleTime: 60 * 1000,
      },
      mutations: {
        retry: false,
      },
      dehydrate: {
        // Default dehydrates `success` only; we also include pending so a
        // Server Component prefetch in flight survives the round-trip.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always a new client.
    return makeQueryClient()
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}
