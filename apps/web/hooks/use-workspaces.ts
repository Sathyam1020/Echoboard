"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { ApiError } from "@/lib/http/api-error"
import { queryKeys } from "@/lib/query/keys"

function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message
  return fallback
}
import {
  activateWorkspace,
  createWorkspace,
  fetchWorkspaceSettings,
  fetchWorkspacesMe,
  regenerateIdentifyKey,
  updateWorkspaceSettings,
} from "@/services/workspaces"

// Workspace + settings rarely change. Bump above the global 60s default so
// navigating between settings tabs doesn't refetch every time. Mutations
// (regen key, settings update, workspace create) invalidate explicitly.
const FIVE_MINUTES = 5 * 60 * 1000

export function useWorkspacesMeQuery() {
  return useQuery({
    queryKey: queryKeys.workspaces.me(),
    queryFn: fetchWorkspacesMe,
    staleTime: FIVE_MINUTES,
  })
}

export function useWorkspaceSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.workspaces.settings(),
    queryFn: fetchWorkspaceSettings,
    staleTime: FIVE_MINUTES,
  })
}

export function useUpdateWorkspaceSettingsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateWorkspaceSettings,
    onSuccess: (next) => {
      qc.setQueryData(queryKeys.workspaces.settings(), next)
      toast.success("Workspace settings saved")
    },
    onError: (err) =>
      toast.error(describeError(err, "Couldn't save workspace settings")),
  })
}

export function useRegenerateIdentifyKeyMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: regenerateIdentifyKey,
    onSuccess: () => {
      // Server returns the new key; force a refetch so settings stays
      // consistent. The caller (`widget-identify-guide`) shows its own
      // success + error toasts with extra context (env-var name,
      // redeploy reminder) — don't double up here.
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
      toast.success("Workspace created")
    },
    onError: (err) =>
      toast.error(describeError(err, "Couldn't create the workspace")),
  })
}

export function useActivateWorkspaceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: activateWorkspace,
    onSuccess: () => {
      // Switching workspaces invalidates pretty much every dashboard query —
      // the new workspace has its own boards, conversations, members. Clear
      // the cache and let consumers refetch.
      qc.clear()
    },
    // No toast here — the consumer (workspace switcher) owns the
    // loading→success/error toast lifecycle so it can swap a single
    // toast id rather than firing two unrelated ones.
  })
}
