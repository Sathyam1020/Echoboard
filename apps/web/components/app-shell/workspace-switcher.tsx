"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import {
  useActivateWorkspaceMutation,
  useWorkspacesMeQuery,
} from "@/hooks/use-workspaces"
import { ApiError } from "@/lib/http/api-error"

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
  // First entry is the active one — the backend bubbles the cookie-targeted
  // workspace to position 0 in /api/workspaces/me's response.
  const active = workspaces[0] ?? null

  // Tracks WHICH workspace id is being switched to so we can highlight
  // the row mid-flight + show its name in the loading toast.
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  // useTransition wraps the router.refresh — its isPending stays true
  // until Next.js finishes the SSR refetch + re-render, so the spinner
  // doesn't disappear the moment the API call resolves while the page
  // is still mid-rerender against the new workspace.
  const [isRefreshing, startTransition] = useTransition()
  const isSwitching = activate.isPending || isRefreshing

  // Clear the per-row spinner once the transition wraps up. Covers
  // success path; error path clears it inline (see onError below).
  useEffect(() => {
    if (!isSwitching && switchingId) setSwitchingId(null)
  }, [isSwitching, switchingId])

  function onPick(id: string, name: string) {
    if (id === active?.id || isSwitching) return
    const toastId = toast.loading(`Switching to ${name}…`)
    setSwitchingId(id)
    activate.mutate(id, {
      onSuccess: () => {
        startTransition(() => {
          router.refresh()
        })
        toast.success(`Switched to ${name}`, { id: toastId })
      },
      onError: (err) => {
        toast.error(
          err instanceof ApiError ? err.message : "Couldn't switch workspace",
          { id: toastId },
        )
        setSwitchingId(null)
      },
      onSettled: () => {
        // Only clear the row spinner once the page has finished re-rendering.
        // The transition's isPending guard ensures we don't flicker between
        // states. We DO clear here on error (handled above already).
      },
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isSwitching}
          className="flex w-full items-center gap-2.5 rounded-md p-1.5 transition-colors hover:bg-sidebar-accent disabled:cursor-progress disabled:opacity-70 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1"
          aria-label="Switch workspace"
          aria-busy={isSwitching}
        >
          <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary text-[13px] font-medium text-primary-foreground">
            {(active?.name ?? fallbackName).slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
            <div className="truncate text-[13px] font-medium">
              {active?.name ?? fallbackName}
            </div>
            <div className="text-[11px] leading-none text-muted-foreground capitalize">
              {isSwitching ? "Switching…" : (active?.role ?? "member")}
            </div>
          </div>
          {isSwitching ? (
            <Loader2
              className="size-3.5 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none group-data-[collapsible=icon]:hidden"
              aria-hidden
            />
          ) : (
            <ChevronsUpDown
              className="size-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden"
              aria-hidden
            />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        {workspaces.map((w) => {
          const isActive = w.id === active?.id
          const isLoadingThis = switchingId === w.id
          return (
            <DropdownMenuItem
              key={w.id}
              disabled={isSwitching}
              onSelect={(e) => {
                // Don't auto-close while we're mid-switch — keeps the
                // spinner visible and prevents stray clicks on the next
                // row from queuing another mutation.
                if (isSwitching) e.preventDefault()
                onPick(w.id, w.name)
              }}
              className="flex items-center gap-2"
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-[12px] font-medium">
                {w.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-[13px] font-medium">
                  {w.name}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {w.role}
                </span>
              </div>
              {isLoadingThis ? (
                <Loader2
                  className="ml-auto size-4 animate-spin text-muted-foreground motion-reduce:animate-none"
                  aria-hidden
                />
              ) : isActive ? (
                <Check
                  className="ml-auto size-4 text-muted-foreground"
                  aria-hidden
                />
              ) : null}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSwitching}
          onSelect={() => router.push("/dashboard/team")}
        >
          <Users className="mr-2 size-4" aria-hidden /> Manage team
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isSwitching}
          onSelect={() => router.push("/onboarding/workspace")}
        >
          <Plus className="mr-2 size-4" aria-hidden /> New workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
