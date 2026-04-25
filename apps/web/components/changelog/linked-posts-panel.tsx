"use client"

import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { Check } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { ApiError } from "@/lib/http/api-error"
import { fetchShippedPosts } from "@/services/changelog-admin"

import type { ShippedPost } from "./types"

// Design shows the linked-posts panel as a list of shipped posts with
// checkbox-style selection — not a search-and-add chip picker. Tapping a
// card toggles it; a search input sits at the bottom for filtering.
export function LinkedPostsPanel({
  selectedIds,
  onChange,
}: {
  selectedIds: string[]
  onChange: (nextIds: string[]) => void
}) {
  const [all, setAll] = useState<ShippedPost[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    let cancelled = false
    fetchShippedPosts()
      .then((res) => {
        if (cancelled) return
        setAll(res.posts)
      })
      .catch((err) => {
        if (cancelled) return
        setError(
          err instanceof ApiError ? err.message : "Failed to load posts",
        )
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  // Always surface selected posts at the top so admins can see what's already
  // linked, then the unselected shipped posts filtered by search.
  const visible = useMemo(() => {
    if (!all) return []
    const q = search.trim().toLowerCase()
    const matches = (p: ShippedPost) =>
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    const selected = all.filter((p) => selectedSet.has(p.id))
    const rest = all.filter((p) => !selectedSet.has(p.id) && matches(p))
    return [...selected, ...rest]
  }, [all, search, selectedSet])

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? (
        <p className="text-[12px] text-destructive">{error}</p>
      ) : all === null ? (
        <p className="text-[12px] text-muted-foreground">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-[12px] text-muted-foreground">
          {all.length === 0
            ? "No shipped posts yet. Mark a post as Shipped to link it here."
            : "No matching posts."}
        </p>
      ) : (
        visible.map((p) => {
          const on = selectedSet.has(p.id)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              aria-pressed={on}
              className={cn(
                "flex items-start gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors",
                on
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-muted/40",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-sm border",
                  on ? "border-primary bg-primary" : "border-border bg-card",
                )}
              >
                {on ? (
                  <Check
                    className="size-2.5 text-primary-foreground"
                    aria-hidden
                    strokeWidth={3}
                  />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium leading-snug">
                  {p.title}
                </span>
                <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                  {p.boardName}
                </span>
              </span>
            </button>
          )
        })
      )}
      <Input
        type="search"
        placeholder="Search shipped posts…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-1 h-8 text-[13px]"
      />
    </div>
  )
}
