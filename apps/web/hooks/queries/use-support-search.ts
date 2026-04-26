"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import { queryKeys } from "@/lib/query/keys"
import { searchSupport } from "@/services/support"

// Debounced FTS hook — caller passes raw input, we fire the query after
// 250ms of no keystrokes so typing doesn't burn round-trips.
export function useSupportSearchQuery(rawQuery: string) {
  const [debounced, setDebounced] = useState(rawQuery)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(rawQuery.trim()), 250)
    return () => clearTimeout(t)
  }, [rawQuery])

  return useQuery({
    queryKey: queryKeys.support.search(debounced),
    enabled: debounced.length > 0,
    queryFn: () => searchSupport(debounced),
    staleTime: 30 * 1000,
  })
}
