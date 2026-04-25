import "server-only"

import { serverHttp } from "@/lib/http/server-axios"
import type { PostDetailResponse } from "@/components/boards/types"

export function fetchPostDetailSSR(postId: string): Promise<PostDetailResponse> {
  return serverHttp.get<PostDetailResponse>(
    `/api/posts/${encodeURIComponent(postId)}`,
  )
}
