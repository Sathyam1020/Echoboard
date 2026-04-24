export function PostStatsCard({
  voteCount,
  commentCount,
  createdAt,
}: {
  voteCount: number
  commentCount: number
  createdAt: string
}) {
  const created = new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const stats: Array<{ label: string; value: string | number }> = [
    { label: "Votes", value: voteCount },
    { label: "Comments", value: commentCount },
    { label: "Created", value: created },
  ]

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <header className="border-b border-border px-4 py-3">
        <h3 className="text-[13px] font-medium">Stats</h3>
      </header>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-4">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
            <div className="mt-0.5 font-mono text-[15px] font-medium tabular-nums">
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
