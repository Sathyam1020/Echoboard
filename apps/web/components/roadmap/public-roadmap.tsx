import { MapPin, Sparkles, Zap, type LucideIcon } from "lucide-react"

import type { PostRow } from "@/components/boards/types"
import { EmptyHint } from "@/components/common/empty-hint"

import {
  groupPostsForRoadmap,
  ROADMAP_COLUMNS,
} from "./group-posts"
import { RoadmapCard } from "./roadmap-card"
import { RoadmapColumn, type RoadmapColumnKey } from "./roadmap-column"

// Per-status empty-state copy + icon, surfaced when a column has no
// posts. Inline variant so the empty state lives comfortably inside
// the column without competing with the column's own border.
const COLUMN_EMPTY: Record<
  RoadmapColumnKey,
  { icon: LucideIcon; title: string }
> = {
  planned: { icon: MapPin, title: "Nothing planned yet" },
  progress: { icon: Zap, title: "Nothing in progress" },
  shipped: { icon: Sparkles, title: "Nothing shipped yet" },
}

export function PublicRoadmap({
  posts,
  workspaceSlug,
}: {
  posts: PostRow[]
  workspaceSlug: string
}) {
  const grouped = groupPostsForRoadmap(posts)

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {ROADMAP_COLUMNS.map((key) => {
        const columnPosts = grouped[key]
        const empty = COLUMN_EMPTY[key]
        return (
          <RoadmapColumn key={key} columnKey={key} count={columnPosts.length}>
            {columnPosts.length === 0 ? (
              <EmptyHint
                variant="inline"
                icon={empty.icon}
                title={empty.title}
              />
            ) : (
              columnPosts.map((p) => {
                // Workspace-aggregated roadmap — post lives on its own
                // board, link uses that board's slug (not a shared one).
                const slug = p.board?.slug
                const href = slug
                  ? `/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(slug)}/${encodeURIComponent(p.id)}`
                  : `/${encodeURIComponent(workspaceSlug)}`
                return <RoadmapCard key={p.id} post={p} href={href} />
              })
            )}
          </RoadmapColumn>
        )
      })}
    </div>
  )
}
