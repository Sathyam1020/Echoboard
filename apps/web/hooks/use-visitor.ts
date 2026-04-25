"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

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

export function useCreateGuestVisitorMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createGuestVisitor,
    onSuccess: (res) => {
      qc.setQueryData(queryKeys.visitors.me(), { visitor: res.visitor })
    },
  })
}

export function useIdentifyVisitorMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: identifyVisitor,
    onSuccess: (res) => {
      qc.setQueryData(queryKeys.visitors.me(), { visitor: res.visitor })
    },
  })
}

export function useBridgeVisitorFromSessionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bridgeVisitorFromSession,
    onSuccess: (res) => {
      qc.setQueryData(queryKeys.visitors.me(), { visitor: res.visitor })
    },
  })
}

export function useSignOutVisitorMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: signOutVisitor,
    onSuccess: () => {
      qc.setQueryData(queryKeys.visitors.me(), { visitor: null })
      qc.invalidateQueries({ queryKey: queryKeys.visitors.me() })
    },
  })
}
