export type PostRow = {
  id: string
  title: string
  description: string
  status: string
  createdAt: string
  authorName: string | null
  voteCount: number
  hasVoted: boolean
}
