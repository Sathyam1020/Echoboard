import "server-only"

import { serverHttp } from "@/lib/http/server-axios"
import type {
  CommentsPage,
  PostDetailResponse,
} from "@/components/boards/types"

export function fetchPostDetailSSR(postId: string): Promise<PostDetailResponse> {
  return serverHttp.get<PostDetailResponse>(
    `/api/posts/${encodeURIComponent(postId)}`,
  )
}

export function fetchPostCommentsSSR(args: {
  postId: string
  cursor?: string | null
}): Promise<CommentsPage> {
  const qs = args.cursor ? `?cursor=${encodeURIComponent(args.cursor)}` : ""
  return serverHttp.get<CommentsPage>(
    `/api/posts/${encodeURIComponent(args.postId)}/comments${qs}`,
  )
}
