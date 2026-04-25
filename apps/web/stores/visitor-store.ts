// Visitor identity cache, lifted out of `useVisitorIdentity`'s per-component
// `useState`. The old shape gave each call site (vote button, comment form,
// submit dialog…) its own copy of the visitor — identifying via the modal in
// one component left the others still asking. The store fixes that.
//
// Server data (the visitor row from /api/visitors/me) lives in react-query.
// What zustand owns here is the *short-lived client cache* of "who's the
// actor on this page right now", populated once `ensure()` resolves.
import { createStore } from "zustand/vanilla"
import { devtools } from "zustand/middleware"

import type { VisitorIdentity } from "@/services/visitors"

export type VisitorState = {
  visitor: VisitorIdentity | null
  setVisitor: (v: VisitorIdentity | null) => void
  clear: () => void
}

export const createVisitorStore = (
  init: { visitor: VisitorIdentity | null } = { visitor: null },
) =>
  createStore<VisitorState>()(
    devtools(
      (set) => ({
        visitor: init.visitor,
        setVisitor: (v) => set({ visitor: v }, false, "visitor/set"),
        clear: () => set({ visitor: null }, false, "visitor/clear"),
      }),
      { name: "visitor-store", enabled: process.env.NODE_ENV === "development" },
    ),
  )

export type VisitorStore = ReturnType<typeof createVisitorStore>
