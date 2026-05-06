import { permanentRedirect } from "next/navigation"

// Changelog entry URLs moved to workspace-level. 308 preserves the
// entry id so deep links from external sources continue to land on
// the right entry.
export default async function LegacyBoardChangelogEntryPage({
  params,
}: {
  params: Promise<{
    workspaceSlug: string
    boardSlug: string
    entryId: string
  }>
}) {
  const { workspaceSlug, entryId } = await params
  permanentRedirect(
    `/${encodeURIComponent(workspaceSlug)}/changelog/${encodeURIComponent(entryId)}`,
  )
}
