"use client"

import { useDraggable } from "@dnd-kit/core"

import type { PostRow } from "@/components/boards/types"

import { RoadmapCard } from "./roadmap-card"

export function AdminDraggableCard({
  post,
  href,
}: {
  post: PostRow
  href: string
}) {
  const { attributes, listeners, setNodeRef, isDragging, transform } =
    useDraggable({ id: post.id })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`touch-none ${isDragging ? "opacity-60" : ""}`}
    >
      <RoadmapCard post={post} href={href} />
    </div>
  )
}
