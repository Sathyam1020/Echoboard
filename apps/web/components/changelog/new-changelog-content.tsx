"use client"

import { AdminPageShell } from "@/components/app-shell/admin-page-shell"
import { ChangelogEditor } from "@/components/changelog/changelog-editor"

export function NewChangelogContent() {
  return (
    <AdminPageShell activeItem="changelog">
      <ChangelogEditor mode="create" />
    </AdminPageShell>
  )
}
