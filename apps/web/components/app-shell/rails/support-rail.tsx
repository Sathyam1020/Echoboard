"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Bot,
  ChevronRight,
  Inbox,
  Mail,
  PenSquare,
  Plus,
  Search,
  UserPlus,
  UserX,
  Users,
} from "lucide-react"
import { useCollapsibleState } from "@/hooks/use-collapsible-state"

import { ContextRail, RailGroup, RailLink } from "../context-rail"

export function SupportRail() {
  return (
    <ContextRail
      title="Inbox"
      actions={
        <>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-rail-fg-muted hover:bg-rail-hover hover:text-rail-active-fg"
            aria-label="Search inbox"
          >
            <Search className="size-3.5" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-rail-fg-muted hover:bg-rail-hover hover:text-rail-active-fg"
            aria-label="New conversation"
          >
            <Plus className="size-3.5" aria-hidden />
          </Button>
        </>
      }
    >
      <RailGroup>
        <RailLink href="/dashboard/support" label="My inbox" icon={Inbox} matchExact />
        <RailLink href="/dashboard/support?scope=all" label="All messages" icon={Mail} />
        <RailLink
          href="/dashboard/support?scope=mine"
          label="Created by me"
          icon={PenSquare}
        />
        <RailLink
          href="/dashboard/support?scope=unassigned"
          label="Unassigned"
          icon={UserX}
        />
      </RailGroup>

      <Collapsible
        storageKey="support-team-inboxes"
        label="Team inboxes"
        trailing={<Plus className="size-3" aria-hidden />}
      >
        <RailLink label="No team inboxes yet" disabled icon={Inbox} />
      </Collapsible>

      <Collapsible
        storageKey="support-ai-agent"
        label="AI Agent"
        defaultOpen
        icon={Bot}
      >
        <RailLink href="/dashboard/support?ai=resolved" label="Resolved" icon={Bot} />
        <RailLink
          href="/dashboard/support?ai=routed"
          label="Routed to human"
          icon={UserPlus}
        />
      </Collapsible>

      <Collapsible
        storageKey="support-teammates"
        label="Teammates"
        trailing={<Plus className="size-3" aria-hidden />}
      >
        <RailLink label="No teammates yet" disabled icon={Users} />
      </Collapsible>
    </ContextRail>
  )
}

function Collapsible({
  storageKey,
  label,
  defaultOpen,
  icon: Icon,
  trailing,
  children,
}: {
  storageKey: string
  label: string
  defaultOpen?: boolean
  icon?: typeof Bot
  trailing?: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useCollapsibleState(storageKey, defaultOpen ?? false)
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1 flex items-center gap-1 px-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-1.5 text-[11px] font-medium tracking-wide text-rail-fg-subtle uppercase hover:text-rail-fg"
        >
          <ChevronRight
            className={`size-3 transition-transform ${open ? "rotate-90" : ""}`}
            aria-hidden
          />
          {Icon ? <Icon className="size-3" aria-hidden /> : null}
          {label}
        </button>
        {trailing ? (
          <span className="text-rail-fg-subtle">{trailing}</span>
        ) : null}
      </div>
      {open ? <div className="flex flex-col gap-px">{children}</div> : null}
    </div>
  )
}
