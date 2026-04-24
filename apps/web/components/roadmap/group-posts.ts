import type { PostRow } from "@/components/boards/types"

import type { RoadmapColumnKey } from "./roadmap-column"

export const ROADMAP_COLUMNS: readonly RoadmapColumnKey[] = [
  "planned",
  "progress",
  "shipped",
] as const

export type GroupedPosts = Record<RoadmapColumnKey, PostRow[]>

export function groupPostsForRoadmap(posts: PostRow[]): GroupedPosts {
  const grouped: GroupedPosts = { planned: [], progress: [], shipped: [] }
  for (const p of posts) {
    if ((ROADMAP_COLUMNS as readonly string[]).includes(p.status)) {
      grouped[p.status as RoadmapColumnKey].push(p)
    }
  }
  // Most-voted first inside each column.
  for (const k of ROADMAP_COLUMNS) {
    grouped[k].sort((a, b) => b.voteCount - a.voteCount)
  }
  return grouped
}
