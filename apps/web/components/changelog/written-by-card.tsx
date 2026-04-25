import { Avatar } from "@/components/boards/avatar"

// "Written by …" attribution card shown at the bottom of a changelog
// detail page. Author always resolves to the workspace owner today
// (only owners can publish changelog entries) — role label is hardcoded
// to "Team" rather than reading from the user record.
export function WrittenByCard({
  author,
}: {
  author: { name: string; image: string | null } | null
}) {
  if (!author) return null
  return (
    <aside className="rounded-xl border border-border bg-card p-5">
      <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Written by
      </div>
      <div className="mt-3 flex items-center gap-3">
        {author.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={author.image}
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <Avatar name={author.name} size={40} />
        )}
        <div className="min-w-0">
          <div className="truncate text-[14px] font-medium text-foreground">
            {author.name}
          </div>
          <div className="text-[12.5px] text-muted-foreground">Team</div>
        </div>
      </div>
    </aside>
  )
}
