"use client"

import { useState } from "react"

import { SettingsSection } from "@/components/settings/section-card"
import { WidgetCustomizerForm } from "@/components/settings/widget-customizer-form"
import { WidgetHmacSection } from "@/components/settings/widget-hmac-section"
import { WidgetInstallSnippet } from "@/components/settings/widget-install-snippet"
import { useDashboardBoardsQuery } from "@/hooks/use-dashboard"
import { useWidgetConfigQuery } from "@/hooks/use-widget-config"
import { useWorkspaceSettingsQuery } from "@/hooks/use-workspaces"

export function WidgetSettingsContent({ origin }: { origin: string }) {
  const boardsQuery = useDashboardBoardsQuery()
  const settingsQuery = useWorkspaceSettingsQuery()

  // V1 wires the widget to the first board. Multi-board support comes when
  // the customizer grows a board switcher (queued for v2).
  const firstBoard = boardsQuery.data?.boards[0]
  const widgetCfg = useWidgetConfigQuery(firstBoard?.boardId ?? "")

  const [previewKey, setPreviewKey] = useState(0)

  if (!firstBoard || !settingsQuery.data || !widgetCfg.data) return null

  const previewSrc = `/widget/${encodeURIComponent(firstBoard.boardId)}?preview=1&t=${previewKey}`

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-5">
        <SettingsSection
          title="Install snippet"
          description="One <script> tag, async, ~3KB. Self-bootstraps a floating button on your site."
        >
          <WidgetInstallSnippet boardId={firstBoard.boardId} origin={origin} />
        </SettingsSection>

        <SettingsSection
          title="Customize"
          description="Visual tweaks for the floating button + panel. Saved per board."
        >
          <WidgetCustomizerForm
            boardId={firstBoard.boardId}
            initial={{
              color: widgetCfg.data.color,
              position: widgetCfg.data.position,
              buttonText: widgetCfg.data.buttonText,
              showBranding: widgetCfg.data.showBranding,
            }}
            onSaved={() => {
              // Bump the iframe key so the preview reloads with the new
              // server-side widget config. The WidgetCustomizerForm mutation
              // already updated the cache.
              setPreviewKey((k) => k + 1)
            }}
          />
        </SettingsSection>

        <SettingsSection
          title="Identify your users"
          description="Skip the email prompt for users who are already signed into your product. Pair with HMAC for impersonation-proof security."
        >
          <WidgetHmacSection
            initialSecret={settingsQuery.data.settings.identifySecretKey}
            initialRequireSigned={settingsQuery.data.settings.requireSignedIdentify}
          />
        </SettingsSection>
      </div>

      <aside className="flex flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
        <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Live preview
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
            <div className="flex gap-1">
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
            </div>
            <div className="ml-2 truncate font-mono text-[11px] text-muted-foreground">
              your-app.com
            </div>
          </div>
          <iframe
            key={previewKey}
            src={previewSrc}
            title="Widget preview"
            className="h-[520px] w-full"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
        <p className="text-[11.5px] text-muted-foreground">
          Preview reloads when you save. The actual widget on your site uses
          the same UI inside an iframe.
        </p>
      </aside>
    </div>
  )
}
