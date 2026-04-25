"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import { fetchAllFeedback } from "@/services/boards"

export function useAllFeedbackQuery(workspaceSlug: string) {
  return useQuery({
    queryKey: queryKeys.boards.allFeedback(workspaceSlug),
    queryFn: () => fetchAllFeedback(workspaceSlug),
  })
}
