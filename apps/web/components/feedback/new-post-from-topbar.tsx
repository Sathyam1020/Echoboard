"use client"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Plus } from "lucide-react"
import { useState } from "react"

import type { SidebarBoard } from "@/components/app-shell/app-sidebar-types"
import { NewPostDialog } from "@/components/feedback/new-post-dialog"

// Topbar variant of the new-post button. When a board is already in
// scope (filter selected) we render NewPostDialog directly. Otherwise
// we surface a board picker dropdown first; selecting a board opens
// the dialog for that board.
export function NewPostFromTopbar({
  boards,
  activeBoardId,
}: {
  boards: SidebarBoard[]
  activeBoardId: string | null
}) {
  const [pickedBoardId, setPickedBoardId] = useState<string | null>(null)
  const [forceOpen, setForceOpen] = useState(false)

  if (activeBoardId) {
    return <NewPostDialog boardId={activeBoardId} />
  }

  if (pickedBoardId && forceOpen) {
    return (
      <NewPostDialog
        boardId={pickedBoardId}
        defaultOpen
        onOpenChange={(open) => {
          if (!open) {
            setForceOpen(false)
            setPickedBoardId(null)
          }
        }}
      />
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5" disabled={boards.length === 0}>
          <Plus className="size-3.5" aria-hidden />
          New post
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        {boards.map((b) => (
          <DropdownMenuItem
            key={b.id}
            onSelect={() => {
              setPickedBoardId(b.id)
              setForceOpen(true)
            }}
            className="flex items-center gap-2"
          >
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
