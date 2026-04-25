"use client"

import { createContext, type ReactNode, useContext, useState } from "react"
import { useStore } from "zustand"

import {
  createVisitorStore,
  type VisitorState,
  type VisitorStore,
} from "./visitor-store"

// Per-mount store instance via `useState`'s lazy initializer. A module-level
// singleton would leak state between requests on the server (every render
// would share the same store across users); `useState(() => createStore())`
// instantiates exactly once per component lifetime, on first render.
//
// Why useState and not useRef: React's lint rule flags reading `ref.current`
// during render (it can desync with React's reconciler). useState's lazy
// init achieves the same one-time creation while the value is part of state,
// which is safe to read in render.

const VisitorStoreContext = createContext<VisitorStore | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [visitorStore] = useState(createVisitorStore)
  return (
    <VisitorStoreContext.Provider value={visitorStore}>
      {children}
    </VisitorStoreContext.Provider>
  )
}

export function useVisitorStore<T>(selector: (s: VisitorState) => T): T {
  const ctx = useContext(VisitorStoreContext)
  if (!ctx) {
    throw new Error("useVisitorStore must be used within <StoreProvider>")
  }
  return useStore(ctx, selector)
}
