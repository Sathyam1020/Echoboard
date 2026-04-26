import { Package } from "lucide-react"

import { EmptyHint } from "@/components/common/empty-hint"

import { PublicEntry } from "./public-entry"
import type { PublicChangelogEntry } from "./types"

export function PublicChangelog({
  entries,
  workspaceSlug,
  boardSlug,
}: {
  entries: PublicChangelogEntry[]
  workspaceSlug: string
  /** Board slug for the per-entry detail URL — passed through to PublicEntry. */
  boardSlug: string
}) {
  if (entries.length === 0) {
    return (
      <EmptyHint
        icon={Package}
        title="No updates shipped yet"
        description="When the team ships something, it'll land here. Check back soon."
      />
    )
  }

  return (
    <div className="flex flex-col">
      {entries.map((e) => (
        <PublicEntry
          key={e.id}
          entry={e}
          workspaceSlug={workspaceSlug}
          boardSlug={boardSlug}
        />
      ))}
    </div>
  )
}
