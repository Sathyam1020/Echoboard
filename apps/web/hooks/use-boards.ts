"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import { createBoard } from "@/services/boards-admin"

export function useCreateBoardMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createBoard,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.boards() })
    },
  })
}
