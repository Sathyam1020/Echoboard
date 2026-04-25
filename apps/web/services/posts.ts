import { httpClient } from "@/lib/http/axios-client"
import type {
  CommentsPage,
  PostDetailResponse,
} from "@/components/boards/types"

export type { PostDetailResponse, CommentsPage }

export async function fetchPostDetail(postId: string): Promise<PostDetailResponse> {
  const { data } = await httpClient.get<PostDetailResponse>(
    `/api/posts/${encodeURIComponent(postId)}`,
  )
  return data
}

export async function fetchPostComments(args: {
  postId: string
  cursor?: string | null
}): Promise<CommentsPage> {
  const qs = args.cursor ? `?cursor=${encodeURIComponent(args.cursor)}` : ""
  const { data } = await httpClient.get<CommentsPage>(
    `/api/posts/${encodeURIComponent(args.postId)}/comments${qs}`,
  )
  return data
}
