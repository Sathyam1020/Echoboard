import { cn } from "@workspace/ui/lib/utils"

import type { Competitor } from "@/content/alternatives"

// Side-by-side pricing card showing what each tool costs at different
// user-count tiers. Highlights flat pricing as a column-spanning callout
// when one of the two is EchoBoard.
//
// Per-tier cost numbers use whatever shape the competitor's pricing model
// implies. For Canny (per-tracked-user), we show their published tiers.
// For competitors we haven't yet verified (Phase 3), the `costAtScale`
// arrays in the competitor data file will populate this — until then we
// fall back to showing only the headline `pricing` string.

type PricingRow = {
  userCount: number
  label: string
  echoboardCost: string
  competitorCost: string
}

// EchoBoard's flat-rate cost stays constant. The competitor side will
// vary by tool; for now we hand-build the rows for the Canny case (the
// only fully researched competitor at this moment). Phase 3 expands this
// per-competitor.
function buildRowsForCompetitor(competitor: Competitor): PricingRow[] {
  // Canny — pricing scales by tracked users.
  if (competitor.slug === "canny") {
    return [
      {
        userCount: 100,
        label: "Up to 100 tracked users",
        echoboardCost: "Free",
        competitorCost: "$19/mo (Core, annual)",
      },
      {
        userCount: 500,
        label: "Up to 500 tracked users",
        echoboardCost: "Free",
        competitorCost: "$79/mo (Pro, annual)",
      },
      {
        userCount: 1000,
        label: "Up to 1,000 tracked users",
        echoboardCost: "Free",
        competitorCost: "$79/mo (Pro, annual)",
      },
      {
        userCount: 5000,
        label: "5,000+ tracked users",
        echoboardCost: "$49/mo (Pro, flat)",
        competitorCost: "Custom (Business)",
      },
    ]
  }

  // Generic fallback — single row showing headline pricing only. Phase 3
  // research will expand this per competitor.
  return [
    {
      userCount: 0,
      label: "Headline pricing",
      echoboardCost: "Free / Pro $49/mo flat",
      competitorCost: competitor.pricing,
    },
  ]
}

export function PricingComparison({
  competitor,
}: {
  competitor: Competitor
}) {
  const rows = buildRowsForCompetitor(competitor)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-5 py-3 text-left text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                Audience size
              </th>
              <th className="px-5 py-3 text-left text-[12.5px] font-medium">
                EchoBoard
              </th>
              <th className="px-5 py-3 text-left text-[12.5px] font-medium">
                {competitor.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isLast = idx === rows.length - 1
              return (
                <tr
                  key={row.userCount}
                  className={isLast ? "" : "border-b border-border-soft"}
                >
                  <td className="px-5 py-3 text-foreground/90">{row.label}</td>
                  <td
                    className={cn(
                      "px-5 py-3 font-mono tabular-nums",
                      row.echoboardCost === "Free" && "text-foreground",
                    )}
                  >
                    {row.echoboardCost}
                  </td>
                  <td className="px-5 py-3 font-mono tabular-nums text-foreground/90">
                    {row.competitorCost}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border-soft bg-muted/40 px-5 py-3 text-[12.5px] text-muted-foreground">
        EchoBoard's price doesn't change as your audience grows.{" "}
        {competitor.name === "Canny"
          ? "Canny's tiers reflect tracked-user counts, billed yearly."
          : `${competitor.name}'s pricing model: ${competitor.pricingModel.toLowerCase()}.`}
      </div>
    </div>
  )
}
