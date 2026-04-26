export type ChangelogEntry = {
  id: string
  title: string
  body: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  authorId: string
  workspaceId: string
}

export type ChangelogListEntry = ChangelogEntry & {
  linkedPostCount: number
}

export type LinkedPost = {
  id: string
  title: string
  boardName: string
  boardSlug: string
}

export type ChangelogEntryDetail = ChangelogEntry & {
  linkedPosts: LinkedPost[]
}

export type PublicChangelogEntry = ChangelogEntry & {
  author: { id: string; name: string; image: string | null } | null
  linkedPosts: Array<{ id: string; title: string; boardSlug: string }>
}

export type ShippedPost = {
  id: string
  title: string
  description: string
  boardName: string
  boardSlug: string
}
