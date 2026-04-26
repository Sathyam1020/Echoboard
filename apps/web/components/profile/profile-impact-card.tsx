// Two-row impact card under the activity heatmap on the profile sidebar.
// "Feedback completed" = posts authored that landed in shipped status.
// "Votes received"     = total votes on posts the actor authored.
export function ProfileImpactCard({
  impact,
}: {
  impact: { shippedCount: number; votesReceived: number }
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="mb-3 text-[13px] font-medium text-foreground">
        Product impact
      </div>
      <dl className="flex flex-col gap-2.5 text-[13px]">
        <Row label="Feedback completed" value={impact.shippedCount} />
        <Row label="Votes received" value={impact.votesReceived} />
      </dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono font-medium tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  )
}
