export type CommentAuthor = {
  id: string
  name: string
  role: "member" | "owner"
}

export type CommentRow = {
  id: string
  postId: string
  parentId: string | null
  body: string
  editedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  author: CommentAuthor | null
}

export type LatestComment = {
  id: string
  body: string
  createdAt: string
  author: { id: string; name: string } | null
}

export type PostRow = {
  id: string
  title: string
  description: string
  status: string
  createdAt: string
  authorName: string | null
  voteCount: number
  hasVoted: boolean
  commentCount: number
  latestComment: LatestComment | null
}

export type PostDetail = {
  id: string
  title: string
  description: string
  status: string
  createdAt: string
  authorName: string | null
  voteCount: number
  hasVoted: boolean
  board: { id: string; name: string; slug: string }
  workspace: {
    id: string
    name: string
    slug: string
    ownerId: string
  }
}

export type PostDetailResponse = {
  post: PostDetail
  comments: CommentRow[]
}
