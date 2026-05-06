import { permanentRedirect } from "next/navigation"

// Changelog moved from per-board to workspace-global. This stub keeps
// the old URL alive with a 308 so external links + bookmarks still
// resolve to the right surface.
export default async function LegacyBoardChangelogPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; boardSlug: string }>
}) {
  const { workspaceSlug } = await params
  permanentRedirect(`/${encodeURIComponent(workspaceSlug)}/changelog`)
}
