"use client"

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { useMemo, useState, useTransition } from "react"

import type { PostRow } from "@/components/boards/types"
import { ApiError } from "@/lib/http/api-error"
import { updatePostStatus } from "@/services/posts-admin"

import { AdminDraggableCard } from "./admin-draggable-card"
import { AdminDroppableColumn } from "./admin-droppable-column"
import {
  groupPostsForRoadmap,
  ROADMAP_COLUMNS,
} from "./group-posts"
import { type RoadmapColumnKey } from "./roadmap-column"

export function AdminRoadmap({
  posts: initialPosts,
}: {
  posts: PostRow[]
}) {
  const [posts, setPosts] = useState<PostRow[]>(initialPosts)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    // distance:5 lets a plain click still fire the card's Link.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const grouped = useMemo(() => groupPostsForRoadmap(posts), [posts])

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const postId = String(active.id)
    const nextStatus = over.id as RoadmapColumnKey
    if (!(ROADMAP_COLUMNS as readonly string[]).includes(nextStatus)) return

    const moving = posts.find((p) => p.id === postId)
    if (!moving || moving.status === nextStatus) return

    const prevStatus = moving.status
    // Optimistic move.
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: nextStatus } : p)),
    )
    setError(null)

    startTransition(async () => {
      try {
        await updatePostStatus(postId, { status: nextStatus })
      } catch (err) {
        // Revert.
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, status: prevStatus } : p,
          ),
        )
        setError(
          err instanceof ApiError ? err.message : "Failed to move card",
        )
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
          {error}
        </p>
      ) : null}

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {ROADMAP_COLUMNS.map((key) => {
            const columnPosts = grouped[key]
            return (
              <AdminDroppableColumn
                key={key}
                columnKey={key}
                count={columnPosts.length}
              >
                {columnPosts.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-[12px] text-muted-foreground">
                    Drag posts here
                  </p>
                ) : (
                  columnPosts.map((p) => (
                    <AdminDraggableCard
                      key={p.id}
                      post={p}
                      href={`/dashboard/feedback/${encodeURIComponent(p.id)}`}
                    />
                  ))
                )}
              </AdminDroppableColumn>
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}
