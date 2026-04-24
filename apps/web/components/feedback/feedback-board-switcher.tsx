"use client"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Check, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"

export type SwitcherBoard = {
  id: string
  name: string
  slug: string
  postCount: number
}

export function FeedbackBoardSwitcher({
  boards,
  activeBoardId,
}: {
  boards: SwitcherBoard[]
  activeBoardId: string
}) {
  const router = useRouter()
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
              router.push(`/dashboard/feedback?boardId=${encodeURIComponent(b.id)}`)
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
