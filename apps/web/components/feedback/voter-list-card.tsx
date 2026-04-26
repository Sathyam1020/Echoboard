import { ActorLink } from "@/components/boards/actor-link"
import { Avatar } from "@/components/boards/avatar"
import type { Voter } from "@/components/boards/types"

export function VoterListCard({
  voters,
  totalVotes,
  workspaceSlug,
}: {
  voters: Voter[]
  totalVotes: number
  /** Optional — when provided, voter rows link to the voter's public
   *  profile in a new tab. */
  workspaceSlug?: string
}) {
  const shown = voters.length
  const more = Math.max(0, totalVotes - shown)

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <header className="flex items-baseline justify-between border-b border-border px-4 py-3">
        <h3 className="text-[13px] font-medium">Voters</h3>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {shown} of {totalVotes}
        </span>
      </header>
      {voters.length === 0 ? (
        <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
          No votes yet.
        </p>
      ) : (
        <ul>
          {voters.map((v, idx) => (
            <li
              key={v.id || idx}
              className={
                idx < voters.length - 1 || more > 0
                  ? "flex items-center gap-2.5 border-b border-border-soft px-4 py-2.5"
                  : "flex items-center gap-2.5 px-4 py-2.5"
              }
            >
              {workspaceSlug ? (
                <ActorLink
                  actor={{ id: v.id, name: v.name }}
                  workspaceSlug={workspaceSlug}
                  className="flex min-w-0 flex-1 items-center gap-2.5"
                >
                  <Avatar name={v.name} size={24} />
                  <span className="min-w-0 flex-1 truncate text-[13px]">
                    {v.name}
                  </span>
                </ActorLink>
              ) : (
                <>
                  <Avatar name={v.name} size={24} />
                  <span className="min-w-0 flex-1 truncate text-[13px]">
                    {v.name}
                  </span>
                </>
              )}
            </li>
          ))}
          {more > 0 ? (
            <li className="px-4 py-2.5 text-center text-[12px] text-muted-foreground">
              and <span className="font-mono tabular-nums">{more}</span> more
            </li>
          ) : null}
        </ul>
      )}
    </section>
  )
}
