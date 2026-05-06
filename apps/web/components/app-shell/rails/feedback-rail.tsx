"use client"

import { ChevronRight, Sparkles, BarChart3, Tags, FolderOpen } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

import {
  STATUS_KEYS,
  STATUS_LABEL,
  StatusIcon,
} from "@/components/boards/status-icon"
import { useCollapsibleState } from "@/hooks/use-collapsible-state"

import type { SidebarBoard } from "../app-sidebar-types"
import { ContextRail, RailDot, RailGroup, RailLink } from "../context-rail"

const FEEDBACK_PATH = "/dashboard/feedback"

export function FeedbackRail({
  workspaceSlug: _workspaceSlug,
  boards,
}: {
  workspaceSlug: string
  boards: SidebarBoard[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const currentStatus = searchParams.get("status")
  const currentBoardId = searchParams.get("boardId")

  // External-link icon points at the active filtered board's public page
  // when one is selected, else the first board.
  const activeBoard = boards.find((b) => b.id === currentBoardId) ?? boards[0]
  const publicHref = activeBoard
    ? `/${activeBoard.workspaceSlug}/${activeBoard.slug}`
    : undefined

  function setFilter(name: "status" | "boardId", value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null) {
      params.delete(name)
    } else {
      params.set(name, value)
    }
    const qs = params.toString()
    const url = `${FEEDBACK_PATH}${qs ? `?${qs}` : ""}`
    startTransition(() => {
      // On the feedback page already → replace so chip toggles don't
      // flood history. Coming from elsewhere → push to land here.
      if (pathname === FEEDBACK_PATH) {
        router.replace(url)
      } else {
        router.push(url)
      }
    })
  }

  return (
    <ContextRail title="Feedback" publicHref={publicHref}>
      <RailGroup label="Statuses">
        {STATUS_KEYS.map((key) => (
          <RailLink
            key={key}
            label={STATUS_LABEL[key]}
            iconNode={<StatusIcon status={key} size={14} />}
            active={currentStatus === key}
            onClick={() =>
              setFilter("status", currentStatus === key ? null : key)
            }
          />
        ))}
      </RailGroup>

      <RailGroup label="Quick Filters">
        <BoardsCollapsible
          boards={boards}
          currentBoardId={currentBoardId}
          onPick={(id) =>
            setFilter("boardId", currentBoardId === id ? null : id)
          }
        />
        <RailLink label="Tags" icon={Tags} disabled trailing={<ComingSoonChip />} />
      </RailGroup>

      <RailGroup label="More">
        <RailLink label="AI Tools" icon={Sparkles} disabled trailing={<ComingSoonChip />} />
        <RailLink label="Analytics" icon={BarChart3} disabled trailing={<ComingSoonChip />} />
      </RailGroup>
    </ContextRail>
  )
}

function BoardsCollapsible({
  boards,
  currentBoardId,
  onPick,
}: {
  boards: SidebarBoard[]
  currentBoardId: string | null
  onPick: (id: string) => void
}) {
  const [open, setOpen] = useCollapsibleState("feedback-boards", true)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-rail-fg transition-colors hover:bg-rail-hover hover:text-rail-active-fg"
      >
        <span className="flex size-4 shrink-0 items-center justify-center text-rail-fg-muted">
          <FolderOpen className="size-[14px]" aria-hidden />
        </span>
        <span className="flex-1 text-left">Boards</span>
        <ChevronRight
          className={`size-3.5 text-rail-fg-muted transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="mt-px ml-5 flex flex-col gap-px border-l border-rail-border pl-2">
          {boards.length === 0 ? (
            <span className="px-2 py-1 text-[12px] text-rail-fg-muted">No boards yet</span>
          ) : (
            boards.map((b) => (
              <RailLink
                key={b.id}
                label={b.name}
                badge={b.postCount}
                iconNode={<RailDot color="var(--brand)" />}
                active={currentBoardId === b.id}
                onClick={() => onPick(b.id)}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

function ComingSoonChip() {
  return (
    <span className="rounded-md bg-rail-hover px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-rail-fg-muted uppercase">
      Soon
    </span>
  )
}
