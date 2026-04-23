export type CommentRow = {
  id: string
  postId: string
  parentId: string | null
  authorId: string
  body: string
  editedAt: Date | null
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
  authorName: string | null
}

export type SerializedCommentAuthor = {
  id: string
  name: string
  role: "member" | "owner"
}

export type SerializedComment = {
  id: string
  postId: string
  parentId: string | null
  body: string
  editedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  author: SerializedCommentAuthor | null
}

function toIso(d: Date | null): string | null {
  return d ? d.toISOString() : null
}

export function serializeComment(
  row: CommentRow,
  workspaceOwnerId: string | null,
): SerializedComment {
  if (row.deletedAt) {
    return {
      id: row.id,
      postId: row.postId,
      parentId: row.parentId,
      body: "[deleted]",
      editedAt: toIso(row.editedAt),
      deletedAt: toIso(row.deletedAt),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      author: null,
    }
  }

  const role: "member" | "owner" =
    workspaceOwnerId && row.authorId === workspaceOwnerId ? "owner" : "member"

  return {
    id: row.id,
    postId: row.postId,
    parentId: row.parentId,
    body: row.body,
    editedAt: toIso(row.editedAt),
    deletedAt: toIso(row.deletedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    author: {
      id: row.authorId,
      name: row.authorName ?? "Unknown",
      role,
    },
  }
}
