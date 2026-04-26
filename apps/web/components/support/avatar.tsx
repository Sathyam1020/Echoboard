// Tiny actor avatar used across the support surface — admin name in the
// thread header, customer in the list rows, assignee chip. Falls back
// to monogram from initials when image is null. Kept local to support/
// because the boards/avatar primitive is post-author-shaped and slightly
// different (status-color halo etc.).

import { cn } from "@workspace/ui/lib/utils"

export function SupportAvatar({
  name,
  image,
  className,
}: {
  name: string
  image?: string | null
  className?: string
}) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={image}
        alt=""
        className={cn(
          "shrink-0 rounded-full object-cover",
          className ?? "size-8",
        )}
      />
    )
  }
  const initials = monogram(name)
  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium",
        className ?? "size-8",
      )}
    >
      {initials}
    </div>
  )
}

function monogram(name: string): string {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  )
}
