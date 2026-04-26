"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { ApiError } from "@/lib/http/api-error"
import { queryKeys } from "@/lib/query/keys"
import { createBoard } from "@/services/boards-admin"

export function useCreateBoardMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createBoard,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.boards() })
      toast.success("Board created")
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't create the board",
      )
    },
  })
}
