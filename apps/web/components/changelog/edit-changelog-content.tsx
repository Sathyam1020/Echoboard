"use client"

import { AdminPageShell } from "@/components/app-shell/admin-page-shell"
import { ChangelogEditor } from "@/components/changelog/changelog-editor"
import type { ShippedPost } from "@/components/changelog/types"
import { useChangelogDetailQuery } from "@/hooks/use-changelog"

export function EditChangelogContent({ entryId }: { entryId: string }) {
  const { data } = useChangelogDetailQuery(entryId)
  if (!data) return null

  // The entry's `linkedPosts` only carry id/title/board info; the editor's
  // ShippedPost type wants `description` too — synthesize an empty one since
  // we never need it on the edit screen (we only show the title).
  const initialLinkedPosts: ShippedPost[] = data.entry.linkedPosts.map((p) => ({
    id: p.id,
    title: p.title,
    description: "",
    boardName: p.boardName,
    boardSlug: p.boardSlug,
  }))

  return (
    <AdminPageShell activeItem="changelog">
      <ChangelogEditor
        mode="edit"
        entry={data.entry}
        initialLinkedPosts={initialLinkedPosts}
      />
    </AdminPageShell>
  )
}
