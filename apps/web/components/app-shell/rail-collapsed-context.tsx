"use client"

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react"

import { useCollapsibleState } from "@/hooks/use-collapsible-state"

type RailCollapsedContextValue = {
  collapsed: boolean
  toggle: () => void
  setCollapsed: (next: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (next: boolean) => void
}

const RailCollapsedContext = createContext<RailCollapsedContextValue | null>(
  null,
)

export function RailCollapsedProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedRaw] = useCollapsibleState(
    "context-rail",
    false,
  )
  // Mobile drawer state is ephemeral — never persisted to localStorage so
  // the drawer doesn't pop open on refresh.
  const [mobileOpen, setMobileOpen] = useState(false)

  const setCollapsed = useCallback(
    (next: boolean) => setCollapsedRaw(next),
    [setCollapsedRaw],
  )
  const toggle = useCallback(
    () => setCollapsedRaw((prev) => !prev),
    [setCollapsedRaw],
  )

  return (
    <RailCollapsedContext.Provider
      value={{ collapsed, toggle, setCollapsed, mobileOpen, setMobileOpen }}
    >
      {children}
    </RailCollapsedContext.Provider>
  )
}

// Falls back to a no-op shape when used outside the provider so primitives
// rendered on non-shell pages don't crash. Admin pages always wrap in
// AdminPageShell, so the provider is in scope there.
export function useRailCollapsed(): RailCollapsedContextValue {
  return (
    useContext(RailCollapsedContext) ?? {
      collapsed: false,
      toggle: () => {},
      setCollapsed: () => {},
      mobileOpen: false,
      setMobileOpen: () => {},
    }
  )
}
