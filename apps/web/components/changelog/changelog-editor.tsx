"use client"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { ArrowLeft, ArrowRight } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useRef, useState, useTransition } from "react"

import {
  useCreateChangelogMutation,
  usePublishChangelogMutation,
  useUpdateChangelogMutation,
} from "@/hooks/use-changelog"
import { ApiError } from "@/lib/http/api-error"
import { publishChangelogEntry } from "@/services/changelog-admin"

import { applyMarkdown, type MarkdownAction } from "./apply-markdown"
import { EditorToolbar } from "./editor-toolbar"
import { LinkedPostsPanel } from "./linked-posts-panel"
import type { ChangelogEntry, ShippedPost } from "./types"

// Lazy-load the markdown renderer (react-markdown + remark-gfm +
// rehype-sanitize is ~80KB). It's only mounted in preview mode — most
// edit-tab time doesn't need it. Keeps the libs out of the initial bundle
// for /dashboard/changelog/new and .../[entryId]/edit.
const MarkdownBody = dynamic(
  () => import("./markdown-body").then((m) => m.MarkdownBody),
  {
    ssr: false,
    loading: () => (
      <p className="text-[13px] text-muted-foreground">Loading preview…</p>
    ),
  },
)

type Mode = "create" | "edit"

export function ChangelogEditor({
  mode,
  entry,
  initialLinkedPosts,
}: {
  mode: Mode
  entry?: ChangelogEntry
  initialLinkedPosts?: ShippedPost[]
}) {
  const router = useRouter()
  const [title, setTitle] = useState(entry?.title ?? "")
  const [body, setBody] = useState(entry?.body ?? "")
  const [linkedIds, setLinkedIds] = useState<string[]>(
    (initialLinkedPosts ?? []).map((p) => p.id),
  )
  const [error, setError] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const wasPublished = Boolean(entry?.publishedAt)
  const displayTitle = title.trim().length > 0 ? title : "Untitled"

  const createMutation = useCreateChangelogMutation()
  // Edit-mode mutations are keyed by the entry id — pass empty when in
  // create mode (hook stays idle, never invoked).
  const updateMutation = useUpdateChangelogMutation(entry?.id ?? "")
  const publishExistingMutation = usePublishChangelogMutation(entry?.id ?? "")

  const onToolbarAction = useCallback(
    (action: MarkdownAction) => {
      const ta = textareaRef.current
      if (!ta) return
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const result = applyMarkdown(action, body, start, end)
      setBody(result.value)
      // Selection has to be restored AFTER React re-renders the controlled
      // textarea with the new value — otherwise the DOM still holds the old
      // content when we try to seek into it.
      requestAnimationFrame(() => {
        ta.focus()
        ta.setSelectionRange(result.selectionStart, result.selectionEnd)
      })
    },
    [body],
  )

  // `publish`: true = save+publish, false = save+unpublish (or save draft if
  // new), null = save only (edit mode, leave publish state alone).
  async function save(publish: boolean | null) {
    const payload = {
      title: title.trim(),
      body: body.trim(),
      postIds: linkedIds,
    }
    if (mode === "create") {
      const res = await createMutation.mutateAsync(payload)
      if (publish === true) {
        // Publish the freshly-created entry. Hook is keyed by id which we
        // only just learned, so call the service directly.
        await publishChangelogEntry(res.entry.id, { published: true })
      }
      return res.entry.id
    }
    await updateMutation.mutateAsync(payload)
    if (publish !== null && publish !== wasPublished) {
      await publishExistingMutation.mutateAsync(publish)
    }
    return entry!.id
  }

  function submit(publish: boolean | null) {
    setError(null)
    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters")
      return
    }
    if (body.trim().length < 1) {
      setError("Body can't be empty")
      return
    }
    startTransition(async () => {
      try {
        await save(publish)
        router.push("/dashboard/changelog")
        router.refresh()
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Something went wrong",
        )
      }
    })
  }

  const primaryLabel = wasPublished ? "Save" : "Publish"
  const secondaryLabel = wasPublished ? "Unpublish" : "Save draft"

  return (
    <div className="flex min-h-0 flex-col">
      {/* Custom topbar — replaces AppTopbar on this page so the breadcrumb +
          status line on the left and the Edit/Preview + Save/Publish on the
          right can share one row per the C6 design. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 sm:px-8">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]">
          <Link
            href="/dashboard/changelog"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Changelog
          </Link>
          <span className="text-muted-foreground" aria-hidden>
            ·
          </span>
          <span className="max-w-[280px] truncate text-foreground">
            {displayTitle}
          </span>
          <span className="text-muted-foreground" aria-hidden>
            ·
          </span>
          <span className="text-muted-foreground">
            {wasPublished ? "Published" : "Draft"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-border bg-muted p-0.5">
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className={cn(
                "rounded-sm px-2.5 py-1 text-[12px] transition-colors",
                !previewMode
                  ? "bg-background font-medium text-foreground shadow-[0_0_0_0.5px_var(--border)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode(true)}
              className={cn(
                "rounded-sm px-2.5 py-1 text-[12px] transition-colors",
                previewMode
                  ? "bg-background font-medium text-foreground shadow-[0_0_0_0.5px_var(--border)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Preview
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => submit(wasPublished ? false : false)}
          >
            {isPending ? "Saving…" : secondaryLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            className="gap-1.5"
            onClick={() =>
              submit(mode === "edit" && wasPublished ? null : true)
            }
          >
            {isPending ? "Saving…" : primaryLabel}
            <ArrowRight className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>

      {/* Editor body */}
      <div className="grid grid-cols-1 gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-w-0 flex-col gap-3">
          {/* Wrap the writing surface (title + toolbar + body) in a card so
              it reads as a discrete authoring area against the tinted page
              bg, instead of three loose elements floating on the page. */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {previewMode ? (
              <div className="px-5 py-5 sm:px-7">
                <div className="font-mono text-[12px] text-muted-foreground">
                  {entry?.publishedAt
                    ? new Date(entry.publishedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Draft"}
                </div>
                <h1 className="mt-2 text-2xl font-medium -tracking-[0.02em] sm:text-[32px]">
                  {displayTitle}
                </h1>
                <div className="mt-5">
                  {body.trim().length > 0 ? (
                    <MarkdownBody>{body}</MarkdownBody>
                  ) : (
                    <p className="text-[13px] text-muted-foreground">
                      Nothing to preview yet.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What did you ship?"
                  maxLength={200}
                  className="w-full border-0 bg-transparent px-5 pt-5 pb-2 text-2xl font-medium leading-tight -tracking-[0.02em] text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:px-7 sm:text-[32px]"
                />
                <div className="border-y border-border-soft bg-muted/30 px-3 py-1.5">
                  <EditorToolbar onAction={onToolbarAction} />
                </div>
                <Textarea
                  ref={textareaRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={16}
                  maxLength={20_000}
                  placeholder="Markdown is supported — **bold**, _italic_, `code`, [links](https://)…"
                  className="min-h-[360px] resize-y rounded-none border-0 bg-card px-5 py-4 font-mono text-[13px] leading-[1.7] focus-visible:ring-0 sm:px-7"
                />
              </div>
            )}
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4">
          <SidebarCard
            title="Linked posts"
            subtitle="Customers who voted will be notified."
          >
            <LinkedPostsPanel
              selectedIds={linkedIds}
              onChange={setLinkedIds}
            />
          </SidebarCard>

          <SidebarCard title="Audience">
            <AudienceRow label="Email subscribers" value={0} />
            <AudienceRow label="Voters on linked posts" value={0} />
            <div className="mt-1 border-t border-border-soft pt-2">
              <AudienceRow label="Total notified" value={0} emphasis />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Email delivery is coming soon — counts show 0 until it&apos;s
              wired up.
            </p>
          </SidebarCard>
        </aside>
      </div>
    </div>
  )
}

function SidebarCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <header className="border-b border-border px-4 py-3">
        <h3 className="text-[13px] font-medium">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </header>
      <div className="flex flex-col gap-2 p-3">{children}</div>
    </section>
  )
}

function AudienceRow({
  label,
  value,
  emphasis,
}: {
  label: string
  value: number
  emphasis?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono tabular-nums",
          emphasis ? "font-medium text-foreground" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  )
}
