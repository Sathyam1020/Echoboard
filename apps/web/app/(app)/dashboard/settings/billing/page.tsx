import { Button } from "@workspace/ui/components/button"
import { Check } from "lucide-react"

import { SettingsSection } from "@/components/settings/section-card"
import { serverApi } from "@/lib/api"

type WorkspaceMe = {
  workspaces: Array<{ id: string; name: string; slug: string }>
}

const PRO_FEATURES = [
  "Unlimited boards",
  "Custom domain",
  "Embeddable widget",
  "Remove echoboard branding",
  "Slack + Linear integrations",
  "Email subscribers",
  "Priority support",
]

export default async function BillingPage() {
  await serverApi.get<WorkspaceMe>("/api/workspaces/me")

  return (
    <div className="flex flex-col gap-5">
      <SettingsSection
        title="Current plan"
        description="You're on the free plan. Upgrade when you outgrow it."
        footer={
          <Button size="sm" variant="outline" disabled title="Coming soon">
            Manage billing
          </Button>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[28px] font-medium tracking-tight">
              Free
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              1 board · Unlimited posts · Unlimited members
            </p>
          </div>
          <div className="text-right text-[12px] text-muted-foreground">
            Renews on{" "}
            <span className="font-mono tabular-nums">never</span>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Upgrade to Pro"
        description="Flat $29/month. No per-seat pricing, no per-tracked-user fees."
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-[32px] font-medium tracking-tight">
                $29
              </span>
              <span className="text-[13px] text-muted-foreground">/month</span>
            </div>
            <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {PRO_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-1.5 text-[12.5px]"
                >
                  <Check
                    className="size-3.5 text-primary"
                    aria-hidden
                    strokeWidth={2.5}
                  />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <Button size="sm" disabled title="Coming soon">
            Upgrade
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Billing history"
        description="Past invoices and receipts."
      >
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-[12.5px] text-muted-foreground">
          No invoices yet — you're on the free plan.
        </div>
      </SettingsSection>
    </div>
  )
}
