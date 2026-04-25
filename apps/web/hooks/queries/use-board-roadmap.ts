"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import { fetchBoardRoadmap } from "@/services/boards"

// Roadmap is intentionally not paginated — the view groups posts by
// status, so we need all rows up front. The server caps shipped at 50
// to keep the response bounded; planned/in-progress are returned in
// full because they're inherently limited by team capacity.
export function useBoardRoadmapQuery(args: {
  workspaceSlug: string
  boardSlug: string
}) {
  return useQuery({
    queryKey: queryKeys.boards.roadmap(args.workspaceSlug, args.boardSlug),
    queryFn: () => fetchBoardRoadmap(args),
  })
}
