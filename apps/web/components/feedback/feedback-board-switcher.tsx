"use client"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Check, ChevronDown } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

export type SwitcherBoard = {
  id: string
  name: string
  slug: string
  postCount: number
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
  if (!active) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 font-medium"
        >
          {active.name}
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px]">
        {boards.map((b) => (
          <DropdownMenuItem
            key={b.id}
            onSelect={() => {
              router.push(`${target}?boardId=${encodeURIComponent(b.id)}`)
            }}
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
