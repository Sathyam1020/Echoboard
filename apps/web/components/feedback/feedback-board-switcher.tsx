"use client"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Check, ChevronDown, Loader2 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"

export type SwitcherBoard = {
  id: string
  name: string
  slug: string
  postCount: number
}

// 90 days, matches the workspace cookie. Plenty for "remember my last
// board" without leaking forever.
const ACTIVE_BOARD_COOKIE_MAX_AGE = 90 * 24 * 60 * 60

function persistActiveBoard(boardId: string): void {
  if (typeof document === "undefined") return
  document.cookie = [
    `active_board_id=${encodeURIComponent(boardId)}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${ACTIVE_BOARD_COOKIE_MAX_AGE}`,
  ].join("; ")
}

export function FeedbackBoardSwitcher({
  boards,
  activeBoardId,
  basePath,
}: {
  boards: SwitcherBoard[]
  activeBoardId: string
  /**
   * Where to push the user when they pick a board. Defaults to the current
   * route so the switcher works on /dashboard/feedback, /dashboard/roadmap,
   * etc. without jumping pages.
   */
  basePath?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const target = basePath ?? pathname
  const active = boards.find((b) => b.id === activeBoardId) ?? boards[0]

  // Wraps router.push so the spinner stays through the SSR re-render
  // (data refetch for the new boardId), not just the URL change itself.
  const [isSwitching, startTransition] = useTransition()

  if (!active) return null

  function pickBoard(id: string): void {
    if (id === active!.id || isSwitching) return
    persistActiveBoard(id)
    startTransition(() => {
      router.push(`${target}?boardId=${encodeURIComponent(id)}`)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 font-medium"
          disabled={isSwitching}
        >
          {active.name}
          {isSwitching ? (
            <Loader2
              className="size-3.5 text-muted-foreground motion-safe:animate-spin"
              aria-hidden
            />
          ) : (
            <ChevronDown
              className="size-3.5 text-muted-foreground"
              aria-hidden
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px]">
        {boards.map((b) => (
          <DropdownMenuItem
            key={b.id}
            disabled={isSwitching}
            onSelect={() => pickBoard(b.id)}
            className="flex items-center gap-2"
          >
            <Check
              className={
                b.id === active.id
                  ? "size-3.5 opacity-100"
                  : "size-3.5 opacity-0"
              }
              aria-hidden
            />
            <span className="flex-1 truncate">{b.name}</span>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {b.postCount}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
