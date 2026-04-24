import { DeletePostDialog } from "./delete-post-dialog"
import { EditPostDialog } from "./edit-post-dialog"
import { MergePostDialog } from "./merge-post-dialog"
import { PinToggle } from "./pin-toggle"

export function PostActionsRow({
  postId,
  boardId,
  title,
  description,
  pinned,
}: {
  postId: string
  boardId: string
  title: string
  description: string
  pinned: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <PinToggle postId={postId} initialPinned={pinned} />
      <MergePostDialog postId={postId} boardId={boardId} postTitle={title} />
      <EditPostDialog
        postId={postId}
        initialTitle={title}
        initialDescription={description}
      />
      <DeletePostDialog postId={postId} />
    </div>
  )
}
