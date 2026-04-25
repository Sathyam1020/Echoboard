"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import { fetchBoardBySlug } from "@/services/boards"

export function useBoardBySlugQuery(args: {
  workspaceSlug: string
  boardSlug: string
}) {
  return useQuery({
    queryKey: queryKeys.boards.bySlug(args.workspaceSlug, args.boardSlug),
    queryFn: () => fetchBoardBySlug(args),
  })
}
