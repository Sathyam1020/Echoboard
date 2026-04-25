import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"

export type BoardsListEntry = {
  id: string
  name: string
  slug: string
}

export function BoardsListCard({
  boards,
  workspaceSlug,
  activeBoardSlug,
}: {
  boards: BoardsListEntry[]
  workspaceSlug: string
  activeBoardSlug: string
}) {
  if (boards.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-foreground">Boards</span>
        {boards.length > 1 ? (
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {boards.length}
          </span>
        ) : null}
      </div>
      <ul className="flex flex-col gap-0.5">
        {boards.map((b) => {
          const active = b.slug === activeBoardSlug
          return (
            <li key={b.id}>
              <Link
                href={`/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(b.slug)}`}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    active ? "bg-emerald-500" : "bg-muted-foreground/40",
                  )}
                  aria-hidden
                />
                <span className="truncate">{b.name}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
