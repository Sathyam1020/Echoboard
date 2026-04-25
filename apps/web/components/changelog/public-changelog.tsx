import { Sparkles } from "lucide-react"

import { EmptyHint } from "@/components/common/empty-hint"

import { PublicEntry } from "./public-entry"
import type { PublicChangelogEntry } from "./types"

export function PublicChangelog({
  entries,
  workspaceSlug,
}: {
  entries: PublicChangelogEntry[]
  workspaceSlug: string
}) {
  if (entries.length === 0) {
    return (
      <EmptyHint
        icon={Sparkles}
        title="No changelog entries yet"
        description="Check back soon — we'll post updates here as they ship."
      />
    )
  }

  return (
    <div className="flex flex-col">
      {entries.map((e) => (
        <PublicEntry key={e.id} entry={e} workspaceSlug={workspaceSlug} />
      ))}
    </div>
  )
}
