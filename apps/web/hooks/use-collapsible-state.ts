"use client"

import { useEffect, useState } from "react"

const STORAGE_PREFIX = "rail-collapsed:"

// Persists a boolean per `key` in localStorage so rail collapsibles
// survive route changes and full page reloads. Stored as "1"/"0" to
// avoid JSON parse error handling.
//
// SSR-safe: returns `defaultOpen` until mounted, then hydrates from
// localStorage in a useEffect (so SSR/CSR markup matches on first
// paint — no React hydration warning).
export function useCollapsibleState(key: string, defaultOpen: boolean) {
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(STORAGE_PREFIX + key)
    if (stored === "1") setOpen(true)
    else if (stored === "0") setOpen(false)
  }, [key])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(STORAGE_PREFIX + key, open ? "1" : "0")
  }, [key, open])

  return [open, setOpen] as const
}
