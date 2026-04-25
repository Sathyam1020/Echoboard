"use client"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { Merge, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, useTransition } from "react"

import type { PostRow } from "@/components/boards/types"
import { useMergePostMutation } from "@/hooks/use-posts"
import { fetchAdminPostsByBoard } from "@/services/dashboard"
import { ApiError } from "@/lib/http/api-error"

export function MergePostDialog({
  postId,
  boardId,
  postTitle,
}: {
  postId: string
  boardId: string
  postTitle: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [posts, setPosts] = useState<PostRow[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [targetId, setTargetId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, startSubmit] = useTransition()

  const mergeMutation = useMergePostMutation(postId)

  useEffect(() => {
    if (!open || posts !== null) return
    let cancelled = false
    // First page only — visitor can refine via the search box if the
    // target post isn't on the first page. Server-side ILIKE on title/
    // description means the search hits everything, not just loaded.
    fetchAdminPostsByBoard({ boardId })
      .then((res) => {
        if (cancelled) return
        setPosts(res.posts.filter((p) => p.id !== postId))
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(
          err instanceof ApiError ? err.message : "Failed to load posts",
        )
      })
    return () => {
      cancelled = true
    }
  }, [open, posts, boardId, postId])

  const candidates = useMemo(() => {
    if (!posts) return []
    const q = search.trim().toLowerCase()
    if (!q) return posts
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    )
  }, [posts, search])

  function onSubmit() {
    if (!targetId || isSubmitting) return
    setSubmitError(null)
    startSubmit(async () => {
      try {
        await mergeMutation.mutateAsync(targetId)
        setOpen(false)
        router.push(`/dashboard/feedback/${targetId}`)
        router.refresh()
      } catch (err) {
        setSubmitError(
          err instanceof ApiError ? err.message : "Something went wrong",
        )
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setSearch("")
          setTargetId(null)
          setSubmitError(null)
        }
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="ghost" className="gap-1.5">
          <Merge className="size-3.5" aria-hidden />
          Merge
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Merge post</DialogTitle>
          <DialogDescription>
            Merge <span className="font-medium">&ldquo;{postTitle}&rdquo;</span>{" "}
            into another post on this board. Votes and comments move across;
            this post becomes a redirect.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search posts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-[13px]"
            />
          </div>

          {loadError ? (
            <Alert variant="destructive">
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          ) : posts === null ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              Loading…
            </p>
          ) : candidates.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              {posts.length === 0
                ? "No other posts on this board yet."
                : "No matching posts."}
            </p>
          ) : (
            <ul className="max-h-[260px] overflow-y-auto rounded-md border border-border">
              {candidates.map((p) => {
                const active = p.id === targetId
                return (
                  <li
                    key={p.id}
                    className={
                      p.id !== candidates[candidates.length - 1]?.id
                        ? "border-b border-border-soft"
                        : undefined
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setTargetId(p.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                        active ? "bg-primary/10" : "hover:bg-muted/50",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-1 size-3.5 shrink-0 rounded-full border",
                          active
                            ? "border-primary bg-primary"
                            : "border-border",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium">
                          {p.title}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="font-mono tabular-nums">
                            {p.voteCount}
                          </span>
                          votes
                          <span aria-hidden>·</span>
                          <span className="font-mono tabular-nums">
                            {p.commentCount}
                          </span>
                          comments
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {submitError ? (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!targetId || isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting ? "Merging…" : "Merge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
