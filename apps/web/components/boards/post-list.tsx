import { MessageSquare } from "lucide-react"

import { PostCard } from "./post-card"
import type { PostRow } from "./types"

export function PostList({ posts }: { posts: PostRow[] }) {
  if (posts.length === 0) {
    return (
      <div className="empty-state">
        <MessageSquare
          className="empty-state-icon size-8"
          aria-hidden="true"
        />
        <p className="empty-state-title">No posts yet</p>
        <p className="empty-state-description">
          Be the first — click &ldquo;Submit feedback&rdquo; to share an idea.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
