"use client"

import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import type { ReactNode } from "react"

// Renders an actor's name (and any custom children — typically an
// avatar + name pair) as a hover-state link to the public profile.
// Always opens in a new tab so visitors don't lose their place in a
// feedback thread.
//
// `actor` may be null/empty-id (deleted/system rows, or rows from
// older cached data that pre-dates the authorId plumbing). In that
// case the component renders plain text — never a broken link.
export function ActorLink({
  actor,
  workspaceSlug,
  className,
  children,
}: {
  actor: { id: string | null | undefined; name: string } | null
  workspaceSlug: string
  className?: string
  /** Override the default name render with a custom node tree (e.g.
   *  Avatar + name pair). */
  children?: ReactNode
}) {
  const label = children ?? actor?.name ?? "Deleted user"

  if (!actor || !actor.id) {
    return <span className={className}>{label}</span>
  }

  const href = `/${encodeURIComponent(workspaceSlug)}/profile/${encodeURIComponent(actor.id)}`

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "rounded-sm transition-colors hover:text-foreground hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      {label}
    </Link>
  )
}
