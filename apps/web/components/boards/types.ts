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
  pinnedAt: string | null
  createdAt: string
  authorName: string | null
  voteCount: number
  hasVoted: boolean
  commentCount: number
  latestComment: LatestComment | null
  /** Only present in the all-feedback aggregate view. Lets PostCard
   *  link to the right board and render a "from <board>" badge. */
  board?: { id: string; name: string; slug: string } | null
}

export type Voter = {
  id: string
  name: string
  votedAt: string
}

export type MergedIntoRef = {
  id: string
  title: string
}

export type PostDetail = {
  id: string
  title: string
  description: string
  status: string
  pinnedAt: string | null
  mergedInto: MergedIntoRef | null
  createdAt: string
  authorName: string | null
  voteCount: number
  hasVoted: boolean
  voters: Voter[] | null
  board: { id: string; name: string; slug: string }
  workspace: {
    id: string
    name: string
    slug: string
    ownerId: string
  }
  viewerIsOwner: boolean
}

// Post detail response no longer carries comments — they're paginated
// via `/api/posts/:postId/comments`. See `CommentsPage`.
export type PostDetailResponse = {
  post: PostDetail
}

export type CommentsPage = {
  comments: CommentRow[]
  /** null → no more pages. */
  nextCursor: string | null
}
