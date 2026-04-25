import { Check, Clock, X } from "lucide-react"

import type { Competitor, CompetitorFeatures } from "@/content/alternatives"

// Feature comparison table used on alternative pages, comparison pages,
// and inside blog posts. Renders one column per competitor with a row
// per feature flag.
//
// Three states per cell: ✓ (yes), ✗ (no), Clock + label (coming soon).
// "Coming soon" is computed from the feature flag being `false` on
// EchoBoard's entry — we use it sparingly so the column isn't a sea of
// red X marks.

type Row = {
  key: keyof CompetitorFeatures
  label: string
  /** EchoBoard "false" on these means "on the roadmap", not "not planned". */
  comingSoonOnEchoBoard?: boolean
}

const FEATURE_ROWS: Row[] = [
  { key: "feedbackBoard", label: "Feedback board" },
  { key: "publicRoadmap", label: "Public roadmap" },
  { key: "changelog", label: "Changelog" },
  { key: "widget", label: "Embeddable widget" },
  { key: "voting", label: "Upvoting" },
  { key: "comments", label: "Comments + threads" },
  { key: "anonymousPosting", label: "No-login submission" },
  { key: "flatPricing", label: "Flat pricing (not per user)" },
  { key: "customDomain", label: "Custom domain", comingSoonOnEchoBoard: true },
  { key: "api", label: "API + webhooks", comingSoonOnEchoBoard: true },
  { key: "sso", label: "SSO / SAML", comingSoonOnEchoBoard: true },
  { key: "aiFeatures", label: "AI features", comingSoonOnEchoBoard: true },
  {
    key: "slackIntegration",
    label: "Slack integration",
    comingSoonOnEchoBoard: true,
  },
  {
    key: "jiraIntegration",
    label: "Jira integration",
    comingSoonOnEchoBoard: true,
  },
  {
    key: "mrrWeightedVoting",
    label: "MRR-weighted voting",
    comingSoonOnEchoBoard: true,
  },
]

function Cell({
  value,
  comingSoon,
}: {
  value: boolean
  comingSoon?: boolean
}) {
  if (value) {
    return (
      <div className="flex items-center justify-center">
        <Check
          aria-label="Yes"
          className="size-4 text-foreground"
          strokeWidth={2.5}
        />
      </div>
    )
  }
  if (comingSoon) {
    return (
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <Clock aria-hidden className="size-3.5" />
        <span>Soon</span>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center">
      <X
        aria-label="No"
        className="size-4 text-muted-foreground/50"
        strokeWidth={2}
      />
    </div>
  )
}

export function ComparisonTable({
  left,
  right,
}: {
  left: Competitor
  right: Competitor
}) {
  // Identify which column is EchoBoard so we can render "Coming soon"
  // on its missing-feature cells (the roadmap signal). Other competitors
  // get a plain X — we don't speculate about what they'll ship.
  const isLeftEchoboard = left.slug === "echoboard"
  const isRightEchoboard = right.slug === "echoboard"

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-5 py-3 text-left text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                Feature
              </th>
              <th className="px-5 py-3 text-center text-[12.5px] font-medium">
                {left.name}
              </th>
              <th className="px-5 py-3 text-center text-[12.5px] font-medium">
                {right.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {FEATURE_ROWS.map((row, idx) => {
              const isLast = idx === FEATURE_ROWS.length - 1
              return (
                <tr
                  key={row.key}
                  className={isLast ? "" : "border-b border-border-soft"}
                >
                  <td className="px-5 py-3 text-foreground/90">{row.label}</td>
                  <td className="px-5 py-3">
                    <Cell
                      value={left.features[row.key]}
                      comingSoon={
                        isLeftEchoboard && row.comingSoonOnEchoBoard
                      }
                    />
                  </td>
                  <td className="px-5 py-3">
                    <Cell
                      value={right.features[row.key]}
                      comingSoon={
                        isRightEchoboard && row.comingSoonOnEchoBoard
                      }
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
