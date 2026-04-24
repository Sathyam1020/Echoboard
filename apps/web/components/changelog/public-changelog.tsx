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
      <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
        <p className="text-sm font-medium">No changelog entries yet</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Check back soon — we&apos;ll post updates here as they ship.
        </p>
      </div>
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
