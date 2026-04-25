import { httpClient } from "@/lib/http/axios-client"
import type { PostDetailResponse } from "@/components/boards/types"

export type { PostDetailResponse }

export async function fetchPostDetail(postId: string): Promise<PostDetailResponse> {
  const { data } = await httpClient.get<PostDetailResponse>(
    `/api/posts/${encodeURIComponent(postId)}`,
  )
  return data
}
