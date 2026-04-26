import { httpClient } from "@/lib/http/axios-client"
import type {
  PostsPage,
  PostRowWithBoard,
} from "@/services/boards"

export type ProfileActor = {
  id: string
  name: string
  image: string | null
  kind: "user" | "visitor"
  memberSince: string
}

export type ProfileResponse = {
  workspace: { id: string; name: string; slug: string }
  actor: ProfileActor
  totals: {
    feedbackCount: number
    commentCount: number
    voteCount: number
  }
  impact: {
    shippedCount: number
    votesReceived: number
  }
  /** 12 buckets — index 0 = oldest week, index 11 = current week. */
  activity: number[]
}

export async function fetchProfile(args: {
  workspaceSlug: string
  actorId: string
}): Promise<ProfileResponse> {
  const { data } = await httpClient.get<ProfileResponse>(
    `/api/workspaces/${encodeURIComponent(args.workspaceSlug)}/profile/${encodeURIComponent(args.actorId)}`,
  )
  return data
}

export async function fetchProfileFeedback(args: {
  workspaceSlug: string
  actorId: string
  cursor?: string | null
}): Promise<PostsPage<PostRowWithBoard>> {
  const params = new URLSearchParams()
  if (args.cursor) params.set("cursor", args.cursor)
  const qs = params.toString()
  const { data } = await httpClient.get<PostsPage<PostRowWithBoard>>(
    `/api/workspaces/${encodeURIComponent(args.workspaceSlug)}/profile/${encodeURIComponent(args.actorId)}/feedback${qs ? `?${qs}` : ""}`,
  )
  return data
}

export type ProfileCommentRow = {
  id: string
  body: string
  createdAt: string
  post: { id: string; title: string }
  board: { slug: string; name: string }
}

export type ProfileCommentsPage = {
  comments: ProfileCommentRow[]
  nextCursor: string | null
}

export async function fetchProfileComments(args: {
  workspaceSlug: string
  actorId: string
  cursor?: string | null
}): Promise<ProfileCommentsPage> {
  const qs = args.cursor ? `?cursor=${encodeURIComponent(args.cursor)}` : ""
  const { data } = await httpClient.get<ProfileCommentsPage>(
    `/api/workspaces/${encodeURIComponent(args.workspaceSlug)}/profile/${encodeURIComponent(args.actorId)}/comments${qs}`,
  )
  return data
}
