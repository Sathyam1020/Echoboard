"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { ApiError } from "@/lib/http/api-error"
import { queryKeys } from "@/lib/query/keys"
import {
  bridgeVisitorFromSession,
  createGuestVisitor,
  fetchVisitorMe,
  identifyVisitor,
  signOutVisitor,
} from "@/services/visitors"

export function useVisitorMeQuery(opts: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.visitors.me(),
    queryFn: fetchVisitorMe,
    enabled: opts.enabled ?? true,
    retry: false,
  })
}

// Visitor identity mutations are mostly silent — they happen in the
// background as part of larger flows (post a comment, vote on a post).
// The flow that triggered them shows its own success toast, so we
// don't double up here. We do surface failures, since those would
// otherwise feel like a no-op from the user's perspective.

export function useCreateGuestVisitorMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createGuestVisitor,
    onSuccess: (res) => {
      qc.setQueryData(queryKeys.visitors.me(), { visitor: res.visitor })
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't sign you in",
      ),
  })
}

export function useIdentifyVisitorMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: identifyVisitor,
    onSuccess: (res) => {
      qc.setQueryData(queryKeys.visitors.me(), { visitor: res.visitor })
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't save your details",
      ),
  })
}

export function useBridgeVisitorFromSessionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bridgeVisitorFromSession,
    onSuccess: (res) => {
      qc.setQueryData(queryKeys.visitors.me(), { visitor: res.visitor })
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't link your account",
      ),
  })
}

export function useSignOutVisitorMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: signOutVisitor,
    onSuccess: () => {
      qc.setQueryData(queryKeys.visitors.me(), { visitor: null })
      qc.invalidateQueries({ queryKey: queryKeys.visitors.me() })
      toast.success("Signed out")
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't sign you out",
      ),
  })
}
