"use client"

import { useDroppable } from "@dnd-kit/core"
import { type ReactNode } from "react"

import {
  RoadmapColumn,
  type RoadmapColumnKey,
} from "./roadmap-column"

export function AdminDroppableColumn({
  columnKey,
  count,
  children,
}: {
  columnKey: RoadmapColumnKey
  count: number
  children: ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnKey })
  return (
    <div ref={setNodeRef}>
      <RoadmapColumn
        columnKey={columnKey}
        count={count}
        highlighted={isOver}
      >
        {children}
      </RoadmapColumn>
    </div>
  )
}
