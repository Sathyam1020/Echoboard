"use client"

import { MessageSquare } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { PostCard } from "./post-card"
import type { PostRow } from "./types"

export function PostList({
  posts,
  workspaceSlug,
  boardSlug,
  workspaceId,
  workspaceOwnerId,
}: {
  posts: PostRow[]
  workspaceSlug: string
  boardSlug: string
  workspaceId: string
  workspaceOwnerId: string
}) {
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
      <AnimatePresence initial={false} mode="popLayout">
        {posts.map((post) => (
          <motion.div
            key={post.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <PostCard
              post={post}
              workspaceSlug={workspaceSlug}
              boardSlug={boardSlug}
              workspaceId={workspaceId}
              workspaceOwnerId={workspaceOwnerId}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
