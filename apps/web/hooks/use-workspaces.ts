"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query/keys"
import {
  createWorkspace,
  fetchWorkspaceSettings,
  fetchWorkspacesMe,
  regenerateIdentifyKey,
  updateWorkspaceSettings,
} from "@/services/workspaces"

export function useWorkspacesMeQuery() {
  return useQuery({
    queryKey: queryKeys.workspaces.me(),
    queryFn: fetchWorkspacesMe,
  })
}

export function useWorkspaceSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.workspaces.settings(),
    queryFn: fetchWorkspaceSettings,
  })
}

export function useUpdateWorkspaceSettingsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateWorkspaceSettings,
    onSuccess: (next) => {
      qc.setQueryData(queryKeys.workspaces.settings(), next)
    },
  })
}

export function useRegenerateIdentifyKeyMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: regenerateIdentifyKey,
    onSuccess: () => {
      // Server returns the new key; force a refetch so settings stays consistent.
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.settings() })
    },
  })
}

export function useCreateWorkspaceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createWorkspace,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces.me() })
    },
  })
}
