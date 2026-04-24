import type { PostRow } from "@/components/boards/types"

import {
  groupPostsForRoadmap,
  ROADMAP_COLUMNS,
} from "./group-posts"
import { RoadmapCard } from "./roadmap-card"
import { RoadmapColumn } from "./roadmap-column"

export function PublicRoadmap({
  posts,
  workspaceSlug,
  boardSlug,
}: {
  posts: PostRow[]
  workspaceSlug: string
  boardSlug: string
}) {
  const grouped = groupPostsForRoadmap(posts)

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {ROADMAP_COLUMNS.map((key) => {
        const columnPosts = grouped[key]
        return (
          <RoadmapColumn key={key} columnKey={key} count={columnPosts.length}>
            {columnPosts.length === 0 ? (
              <p className="px-1 py-4 text-center text-[12px] text-muted-foreground">
                Nothing here yet
              </p>
            ) : (
              columnPosts.map((p) => (
                <RoadmapCard
                  key={p.id}
                  post={p}
                  href={`/${encodeURIComponent(workspaceSlug)}/${encodeURIComponent(boardSlug)}/${encodeURIComponent(p.id)}`}
                />
              ))
            )}
          </RoadmapColumn>
        )
      })}
    </div>
  )
}
