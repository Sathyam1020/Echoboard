"use client"

import { ChevronRight, Sparkles, BarChart3, Tags, FolderOpen } from "lucide-react"

import {
  STATUS_KEYS,
  STATUS_LABEL,
  StatusIcon,
} from "@/components/boards/status-icon"
import { useCollapsibleState } from "@/hooks/use-collapsible-state"

import type { SidebarBoard } from "../app-sidebar-types"
import { ContextRail, RailDot, RailGroup, RailLink } from "../context-rail"

export function FeedbackRail({
  workspaceSlug,
  boards,
}: {
  workspaceSlug: string
  boards: SidebarBoard[]
}) {
  const publicHref = boards[0] ? `/${boards[0].workspaceSlug}/${boards[0].slug}` : undefined

  return (
    <ContextRail title="Feedback" publicHref={publicHref}>
      <RailGroup label="Statuses">
        {STATUS_KEYS.map((key) => (
          <RailLink
            key={key}
            href={`/dashboard/feedback?status=${key}`}
            label={STATUS_LABEL[key]}
            iconNode={<StatusIcon status={key} size={14} />}
          />
        ))}
      </RailGroup>

      <RailGroup label="Quick Filters">
        <BoardsCollapsible boards={boards} />
        <RailLink label="Tags" icon={Tags} disabled trailing={<ComingSoonChip />} />
      </RailGroup>

      <RailGroup label="More">
        <RailLink label="AI Tools" icon={Sparkles} disabled trailing={<ComingSoonChip />} />
        <RailLink label="Analytics" icon={BarChart3} disabled trailing={<ComingSoonChip />} />
      </RailGroup>
    </ContextRail>
  )
}

function BoardsCollapsible({ boards }: { boards: SidebarBoard[] }) {
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
                href={`/${b.workspaceSlug}/${b.slug}`}
                label={b.name}
                badge={b.postCount}
                iconNode={<RailDot color="var(--brand)" />}
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
