"use client"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { ChevronUp, MessageSquare, X } from "lucide-react"
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react"

import { StatusIcon, type StatusKey } from "@/components/boards/status-icon"
import {
  ROADMAP_COLUMNS,
  groupPostsForRoadmap,
} from "@/components/roadmap/group-posts"
import { ApiError } from "@/lib/api"
import type { VisitorIdentity } from "@/lib/visitor-client"
import { setWidgetBearer, widgetApi } from "@/lib/widget-api"
import type { PostRow } from "@/components/boards/types"

type WidgetConfig = {
  boardId: string
  boardName: string
  workspaceId: string
  workspaceName: string
  workspaceSlug: string
  boardSlug: string
  color: string | null
  buttonText: string
  showBranding: boolean
  requireSignedIdentify: boolean
}

type Tab = "submit" | "board" | "roadmap"

export function WidgetUI({
  config,
  initialPosts,
  preview,
}: {
  config: WidgetConfig
  initialPosts: PostRow[]
  preview: boolean
}) {
  const [tab, setTab] = useState<Tab>("submit")
  const [posts, setPosts] = useState<PostRow[]>(initialPosts)
  const [visitor, setVisitor] = useState<VisitorIdentity | null>(null)

  // Identity bootstrap. Two paths:
  //   1. Bearer token from the host page via postMessage — host called
  //      `eb.identify({...})`, the loader posted a token here.
  //   2. Cookie fallback (works when iframe is opened on echoboard.io
  //      same-origin, e.g. the dashboard preview).
  useEffect(() => {
    let cancelled = false

    function handler(e: MessageEvent) {
      if (!e.data || typeof e.data !== "object") return
      if (e.data.type === "echoboard:visitor-token") {
        const token = e.data.token as string | null
        setWidgetBearer(token)
        if (token) {
          // Pull the identified visitor — confirms the token + populates
          // the "submitting as …" line.
          widgetApi
            .get<{ visitor: VisitorIdentity }>("/api/visitors/me")
            .then((r) => {
              if (!cancelled) setVisitor(r.visitor)
            })
            .catch(() => {})
        } else {
          setVisitor(null)
        }
      }
    }

    window.addEventListener("message", handler)
    // Tell the loader we're alive — it'll respond with a token if it has one.
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({ type: "echoboard:ready" }, "*")
    }

    // Same-origin / preview fallback: try the cookie immediately.
    widgetApi
      .get<{ visitor: VisitorIdentity }>("/api/visitors/me")
      .then((r) => {
        if (!cancelled) setVisitor(r.visitor)
      })
      .catch(() => {})

    return () => {
      cancelled = true
      window.removeEventListener("message", handler)
    }
  }, [])

  function close() {
    if (preview) return
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({ type: "echoboard:close" }, "*")
    }
  }

  return (
    <div className="flex h-svh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-[12px] font-medium text-primary-foreground"
            style={{ backgroundColor: config.color ?? "var(--primary)" }}
          >
            {config.workspaceName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium">
              {config.workspaceName}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {config.boardName}
            </div>
          </div>
        </div>
        {!preview ? (
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </header>

      {/* Tabs */}
      <nav className="flex gap-1 border-b border-border px-2">
        {(["submit", "board", "roadmap"] as const).map((t) => {
          const active = tab === t
          const label =
            t === "submit" ? "Submit" : t === "board" ? "Board" : "Roadmap"
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "relative -mb-px border-b-2 px-3 py-2 text-[12.5px] font-medium transition-colors",
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          )
        })}
      </nav>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {tab === "submit" ? (
          <SubmitTab
            config={config}
            visitor={visitor}
            onIdentified={setVisitor}
            onPosted={(p) => {
              setPosts((prev) => [p, ...prev])
              setTab("board")
            }}
          />
        ) : tab === "board" ? (
          <BoardTab
            posts={posts}
            visitor={visitor}
            workspaceSlug={config.workspaceSlug}
            boardSlug={config.boardSlug}
          />
        ) : (
          <RoadmapTab posts={posts} />
        )}
      </div>

      {/* Footer */}
      {config.showBranding ? (
        <footer className="border-t border-border bg-muted/30 px-4 py-2 text-center text-[11px] text-muted-foreground">
          Powered by{" "}
          <a
            href="https://echoboard.io"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:text-foreground hover:underline"
          >
            Echoboard
          </a>
        </footer>
      ) : null}
    </div>
  )
}

// ── Submit ────────────────────────────────────────────────────

function SubmitTab({
  config,
  visitor,
  onIdentified,
  onPosted,
}: {
  config: WidgetConfig
  visitor: VisitorIdentity | null
  onIdentified: (v: VisitorIdentity) => void
  onPosted: (p: PostRow) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const needIdentity = !visitor

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        // 1. Identify if needed. Use widgetApi (Bearer-aware) so the token
        //    is captured for subsequent calls in the same iframe session.
        let v = visitor
        if (!v) {
          const guestRes = await widgetApi.post<{
            visitorToken: string
            visitor: VisitorIdentity
          }>("/api/visitors/guest", {
            workspaceId: config.workspaceId,
            email: email.trim(),
            name: name.trim() || undefined,
          })
          setWidgetBearer(guestRes.visitorToken)
          v = guestRes.visitor
          onIdentified(v)
          // Tell the loader so it can persist the token and reuse it on
          // subsequent panel opens.
          if (typeof window !== "undefined" && window.parent !== window) {
            window.parent.postMessage(
              {
                type: "echoboard:visitor-token-set",
                token: guestRes.visitorToken,
              },
              "*",
            )
          }
        }
        // 2. Submit the post — Bearer carries auth.
        const res = await widgetApi.post<{ post: PostRow }>(
          `/api/boards/${config.boardId}/posts`,
          { title: title.trim(), description: description.trim() },
        )
        onPosted({
          ...res.post,
          voteCount: 0,
          hasVoted: false,
          commentCount: 0,
          latestComment: null,
          pinnedAt: null,
        } as PostRow)
        setTitle("")
        setDescription("")
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3500)
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Something went wrong",
        )
      }
    })
  }

  if (success) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          ✓
        </div>
        <div className="text-[14px] font-medium">Thanks for the feedback</div>
        <p className="text-[12.5px] text-muted-foreground">
          We've added it to the board. You'll get an email if the team replies.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setSuccess(false)}
        >
          Submit another
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="w-title">Title</Label>
        <Input
          id="w-title"
          required
          minLength={3}
          maxLength={140}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's the request?"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="w-description">Description</Label>
        <Textarea
          id="w-description"
          required
          minLength={1}
          maxLength={4000}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Context, expected behavior, links…"
        />
      </div>
      {needIdentity ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="w-email">Your email</Label>
            <Input
              id="w-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="w-name">Your name (optional)</Label>
            <Input
              id="w-name"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Cooper"
            />
          </div>
        </>
      ) : (
        <p className="text-[11.5px] text-muted-foreground">
          Submitting as <strong>{visitor!.name ?? visitor!.email}</strong>
        </p>
      )}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" size="sm" disabled={isPending} className="mt-1">
        {isPending ? "Submitting…" : "Submit"}
      </Button>
    </form>
  )
}

// ── Board ─────────────────────────────────────────────────────

function BoardTab({
  posts,
  visitor,
  workspaceSlug,
  boardSlug,
}: {
  posts: PostRow[]
  visitor: VisitorIdentity | null
  workspaceSlug: string
  boardSlug: string
}) {
  const [voted, setVoted] = useState<Record<string, boolean>>({})
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [pendingId, setPendingId] = useState<string | null>(null)

  // Initialise from props
  useMemo(() => {
    const v: Record<string, boolean> = {}
    const c: Record<string, number> = {}
    for (const p of posts) {
      v[p.id] = p.hasVoted
      c[p.id] = p.voteCount
    }
    setVoted(v)
    setCounts(c)
  }, [posts])

  const onVote = useCallback(
    async (postId: string) => {
      if (!visitor) {
        // Send the user to the Submit tab — that's where the email gate lives.
        // Future improvement: show the gate inline.
        return
      }
      if (pendingId) return
      const prevVoted = voted[postId] ?? false
      const prevCount = counts[postId] ?? 0
      setVoted((s) => ({ ...s, [postId]: !prevVoted }))
      setCounts((s) => ({
        ...s,
        [postId]: prevVoted ? prevCount - 1 : prevCount + 1,
      }))
      setPendingId(postId)
      try {
        const res = await widgetApi.post<{
          hasVoted: boolean
          voteCount: number
        }>(`/api/posts/${postId}/vote`, {})
        setVoted((s) => ({ ...s, [postId]: res.hasVoted }))
        setCounts((s) => ({ ...s, [postId]: res.voteCount }))
      } catch {
        setVoted((s) => ({ ...s, [postId]: prevVoted }))
        setCounts((s) => ({ ...s, [postId]: prevCount }))
      } finally {
        setPendingId(null)
      }
    },
    [pendingId, visitor, voted, counts],
  )

  if (posts.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-[12.5px] text-muted-foreground">
        No posts on this board yet.
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border-soft">
      {posts.slice(0, 50).map((p) => {
        const status = (
          ["review", "planned", "progress", "shipped"].includes(p.status)
            ? p.status
            : "review"
        ) as StatusKey
        const isVoted = voted[p.id] ?? false
        return (
          <li key={p.id} className="flex items-start gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => onVote(p.id)}
              disabled={!visitor || pendingId === p.id}
              aria-pressed={isVoted}
              className={cn(
                "inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[11.5px] font-medium transition-colors",
                isVoted
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                (!visitor || pendingId === p.id) && "cursor-not-allowed opacity-60",
              )}
            >
              <ChevronUp className="size-3" aria-hidden strokeWidth={2.5} />
              <span className="font-mono tabular-nums">
                {counts[p.id] ?? 0}
              </span>
            </button>
            <a
              href={`/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(boardSlug)}/${encodeURIComponent(p.id)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 flex-1 flex-col gap-1"
            >
              <div className="truncate text-[13px] font-medium">{p.title}</div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <StatusIcon status={status} size={11} />
                  {status[0]!.toUpperCase()}
                  {status.slice(1)}
                </span>
                {p.commentCount > 0 ? (
                  <span className="inline-flex items-center gap-0.5">
                    <MessageSquare className="size-3" aria-hidden />
                    <span className="font-mono tabular-nums">
                      {p.commentCount}
                    </span>
                  </span>
                ) : null}
              </div>
            </a>
          </li>
        )
      })}
    </ul>
  )
}

// ── Roadmap ───────────────────────────────────────────────────

function RoadmapTab({ posts }: { posts: PostRow[] }) {
  const grouped = groupPostsForRoadmap(posts)

  return (
    <div className="flex flex-col gap-4 p-4">
      {ROADMAP_COLUMNS.map((key) => {
        const list = grouped[key]
        return (
          <section
            key={key}
            className="overflow-hidden rounded-lg border border-border bg-card"
          >
            <header className="flex items-center gap-2 border-b border-border px-3 py-2">
              <StatusIcon status={key} size={12} />
              <div className="text-[12px] font-medium">
                {key === "planned"
                  ? "Planned"
                  : key === "progress"
                    ? "In progress"
                    : "Shipped"}
              </div>
              <span className="ml-auto font-mono text-[11px] tabular-nums text-muted-foreground">
                {list.length}
              </span>
            </header>
            {list.length === 0 ? (
              <div className="px-3 py-3 text-center text-[11.5px] text-muted-foreground">
                Nothing here yet
              </div>
            ) : (
              <ul className="divide-y divide-border-soft">
                {list.slice(0, 10).map((p) => (
                  <li key={p.id} className="px-3 py-2">
                    <div className="truncate text-[12.5px]">{p.title}</div>
                    <div className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                      {p.voteCount} votes
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
