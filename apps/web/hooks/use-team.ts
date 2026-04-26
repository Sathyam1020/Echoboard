"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { ApiError } from "@/lib/http/api-error"
import { queryKeys } from "@/lib/query/keys"
import {
  acceptInvite,
  changeMemberRole,
  createInvite,
  leaveWorkspace,
  removeMember,
  revokeInvite,
} from "@/services/team"

function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message
  return fallback
}

// Invite + member management mutations. Each one keeps the team page's
// React Query cache consistent — invites list and members list are the
// two views that change.

export function useCreateInviteMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createInvite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.team.invites() })
      toast.success("Invite sent")
    },
    onError: (err) => toast.error(describeError(err, "Couldn't send invite")),
  })
}

export function useRevokeInviteMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: revokeInvite,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.team.invites() })
      toast.success("Invite revoked")
    },
    onError: (err) => toast.error(describeError(err, "Couldn't revoke invite")),
  })
}

export function useAcceptInviteMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: () => {
      // The accept response sets the active_workspace_id cookie server-side
      // and creates a new membership row. Clear the cache so the dashboard
      // re-resolves under the new workspace on next render.
      qc.clear()
    },
    // Errors handled inline by the accept page so it can render the
    // specific failure (expired, mismatched email, …).
  })
}

export function useChangeMemberRoleMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ membershipId, role }: { membershipId: string; role: "admin" | "member" }) =>
      changeMemberRole(membershipId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.team.members() })
      toast.success("Role updated")
    },
    onError: (err) => toast.error(describeError(err, "Couldn't update role")),
  })
}

export function useRemoveMemberMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.team.members() })
      toast.success("Member removed")
    },
    onError: (err) => toast.error(describeError(err, "Couldn't remove member")),
  })
}

export function useLeaveWorkspaceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: leaveWorkspace,
    onSuccess: () => {
      qc.clear()
      toast.success("Left workspace")
    },
    onError: (err) =>
      toast.error(describeError(err, "Couldn't leave the workspace")),
  })
}
