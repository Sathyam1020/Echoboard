import { ActorLink } from "@/components/boards/actor-link"
import { Avatar } from "@/components/boards/avatar"

// "Written by …" attribution card shown in the sidebar of a changelog
// detail page. Author always resolves to the workspace owner today
// (only owners can publish changelog entries) — role label is
// hardcoded to "Team".
//
// When `workspaceSlug` is provided the card links to the author's
// public profile in a new tab.
export function WrittenByCard({
  author,
  workspaceSlug,
}: {
  author: { id: string; name: string; image: string | null } | null
  workspaceSlug?: string
}) {
  if (!author) return null

  const avatar = author.image ? (
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
  )

  const body = (
    <div className="flex items-center gap-3">
      {avatar}
      <div className="min-w-0">
        <div className="truncate text-[14px] font-medium text-foreground">
          {author.name}
        </div>
        <div className="text-[12.5px] text-muted-foreground">Team</div>
      </div>
    </div>
  )

  return (
    <aside className="rounded-xl border border-border bg-card p-5">
      <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Written by
      </div>
      <div className="mt-3">
        {workspaceSlug && author.id ? (
          <ActorLink
            actor={author}
            workspaceSlug={workspaceSlug}
            className="block"
          >
            {body}
          </ActorLink>
        ) : (
          body
        )}
      </div>
    </aside>
  )
}
