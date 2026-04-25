import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Trash2 } from "lucide-react"

import { SettingsSection } from "@/components/settings/section-card"
import { serverApi } from "@/lib/api"

type WorkspaceMe = {
  workspaces: Array<{ id: string; name: string; slug: string }>
}

export default async function GeneralSettingsPage() {
  const { workspaces } = await serverApi.get<WorkspaceMe>(
    "/api/workspaces/me",
  )
  const ws = workspaces[0]!

  return (
    <div className="flex flex-col gap-5">
      <SettingsSection
        title="Workspace details"
        description="Public name and URL slug. Editable from a settings update flow — coming soon."
        footer={
          <Button size="sm" variant="outline" disabled title="Coming soon">
            Save changes
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ws-name">Workspace name</Label>
            <Input id="ws-name" value={ws.name} disabled readOnly />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ws-slug">Workspace URL</Label>
            <div className="flex">
              <span className="inline-flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-[13px] text-muted-foreground">
                echoboard.io/
              </span>
              <Input
                id="ws-slug"
                value={ws.slug}
                disabled
                readOnly
                className="rounded-l-none"
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Workspace logo"
        description="Square image, recommended 256×256. Shown on the public board top bar."
      >
        <div
          aria-disabled="true"
          className="flex h-32 cursor-not-allowed items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-[13px] text-muted-foreground opacity-60"
        >
          Drop image or click to upload — coming soon
        </div>
      </SettingsSection>

      <SettingsSection
        title="Danger zone"
        description="Irreversible actions. Be sure before you click."
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
          <div className="min-w-0">
            <div className="text-[13px] font-medium">Delete workspace</div>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Removes all boards, posts, votes, comments, and members. This
              cannot be undone.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled
            title="Coming soon"
            className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Delete workspace
          </Button>
        </div>
      </SettingsSection>
    </div>
  )
}
