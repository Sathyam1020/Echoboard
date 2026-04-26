import "server-only"

import { serverHttp } from "@/lib/http/server-axios"
import type {
  PostsPage,
  PostRowWithBoard,
} from "@/services/boards"

import type {
  ProfileCommentsPage,
  ProfileResponse,
} from "./profile"

export function fetchProfileSSR(args: {
  workspaceSlug: string
  actorId: string
}): Promise<ProfileResponse> {
  return serverHttp.get<ProfileResponse>(
    `/api/workspaces/${encodeURIComponent(args.workspaceSlug)}/profile/${encodeURIComponent(args.actorId)}`,
  )
}

export function fetchProfileFeedbackSSR(args: {
  workspaceSlug: string
  actorId: string
  cursor?: string | null
}): Promise<PostsPage<PostRowWithBoard>> {
  const qs = args.cursor ? `?cursor=${encodeURIComponent(args.cursor)}` : ""
  return serverHttp.get<PostsPage<PostRowWithBoard>>(
    `/api/workspaces/${encodeURIComponent(args.workspaceSlug)}/profile/${encodeURIComponent(args.actorId)}/feedback${qs}`,
  )
}

export function fetchProfileCommentsSSR(args: {
  workspaceSlug: string
  actorId: string
  cursor?: string | null
}): Promise<ProfileCommentsPage> {
  const qs = args.cursor ? `?cursor=${encodeURIComponent(args.cursor)}` : ""
  return serverHttp.get<ProfileCommentsPage>(
    `/api/workspaces/${encodeURIComponent(args.workspaceSlug)}/profile/${encodeURIComponent(args.actorId)}/comments${qs}`,
  )
}
