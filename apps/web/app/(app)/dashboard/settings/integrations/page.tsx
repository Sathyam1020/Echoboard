import { Button } from "@workspace/ui/components/button"

import { SettingsSection } from "@/components/settings/section-card"

const INTEGRATIONS = [
  {
    name: "Slack",
    description: "Pipe new posts + status changes into a channel.",
    state: "connect" as const,
  },
  {
    name: "Linear",
    description: "Sync shipped statuses from Linear issues.",
    state: "connect" as const,
  },
  {
    name: "Jira",
    description: "Two-way link feedback to Jira tickets.",
    state: "soon" as const,
  },
  {
    name: "Zapier",
    description: "5,000+ apps via triggers and actions.",
    state: "soon" as const,
  },
  {
    name: "GitHub",
    description: "Open issues straight from a feedback post.",
    state: "soon" as const,
  },
  {
    name: "Intercom",
    description: "Capture feedback directly from chat.",
    state: "soon" as const,
  },
]

export default function IntegrationsPage() {
  return (
    <SettingsSection
      title="Integrations"
      description="Hook echoboard into the tools you already use. Slack and Linear are first up; others are queued."
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {INTEGRATIONS.map((i) => (
          <div
            key={i.name}
            className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-[13px] font-medium">
              {i.name.charAt(0)}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div>
                <div className="text-[13.5px] font-medium">{i.name}</div>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {i.description}
                </p>
              </div>
              <div>
                {i.state === "connect" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    title="Coming soon"
                  >
                    Connect
                  </Button>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Coming soon
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SettingsSection>
  )
}
