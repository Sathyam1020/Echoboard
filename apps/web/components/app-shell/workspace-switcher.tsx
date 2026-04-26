"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Check, ChevronsUpDown, Plus, Users } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  useActivateWorkspaceMutation,
  useWorkspacesMeQuery,
} from "@/hooks/use-workspaces"

// Cookie-scoped Notion-style workspace switcher. Lives in the sidebar
// header — clicking it lists every workspace the user is a member of,
// with a role badge. Switching mutates the active_workspace_id cookie
// server-side and `router.refresh()` rehydrates the dashboard against
// the new workspace.

type Workspace = {
  id: string
  name: string
  slug: string
  role: "owner" | "admin" | "member"
}

export function WorkspaceSwitcher({ fallbackName }: { fallbackName: string }) {
  const router = useRouter()
  const { data } = useWorkspacesMeQuery()
  const activate = useActivateWorkspaceMutation()

  const workspaces = (data?.workspaces ?? []) as Workspace[]
  // First entry is the active one in /me's response (sorted by membership
  // recency, with the cookie-scoped one bubbled to the top server-side).
  const active = workspaces[0] ?? null

  function onPick(id: string) {
    if (id === active?.id) return
    activate.mutate(id, {
      onSuccess: () => {
        router.refresh()
      },
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-md p-1.5 hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1"
          aria-label="Switch workspace"
        >
          <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary text-[13px] font-medium text-primary-foreground">
            {(active?.name ?? fallbackName).slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
            <div className="truncate text-[13px] font-medium">
              {active?.name ?? fallbackName}
            </div>
            <div className="text-[11px] leading-none text-muted-foreground capitalize">
              {active?.role ?? "member"}
            </div>
          </div>
          <ChevronsUpDown
            className="size-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        {workspaces.map((w) => (
          <DropdownMenuItem
            key={w.id}
            onSelect={() => onPick(w.id)}
            className="flex items-center gap-2"
          >
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-[12px] font-medium">
              {w.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-[13px] font-medium">{w.name}</span>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {w.role}
              </span>
            </div>
            {w.id === active?.id ? (
              <Check className="ml-auto size-4 text-muted-foreground" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/dashboard/team")}>
          <Users className="mr-2 size-4" aria-hidden /> Manage team
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/onboarding/workspace")}>
          <Plus className="mr-2 size-4" aria-hidden /> New workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
