"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { ApiError } from "@/lib/http/api-error"
import { queryKeys } from "@/lib/query/keys"
import { fetchWidgetConfig, updateWidgetConfig } from "@/services/widget-config"

export function useWidgetConfigQuery(boardId: string) {
  return useQuery({
    queryKey: queryKeys.widget.config(boardId),
    queryFn: () => fetchWidgetConfig(boardId),
    enabled: !!boardId,
  })
}

export function useUpdateWidgetConfigMutation(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      patch: Parameters<typeof updateWidgetConfig>[1],
    ) => updateWidgetConfig(boardId, patch),
    onSuccess: (next) => {
      qc.setQueryData(queryKeys.widget.config(boardId), next)
      toast.success("Widget settings saved")
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Couldn't save widget settings",
      )
    },
  })
}
