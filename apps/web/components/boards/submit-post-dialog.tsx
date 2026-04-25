"use client"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { useCreatePostMutation } from "@/hooks/use-posts"
import { ApiError } from "@/lib/http/api-error"

import { IdentityModal } from "./identity-modal"
import { useVisitorIdentity } from "./use-visitor-identity"

type BoardOption = { id: string; name: string; slug: string }

// Two flavors of the dialog:
//  - Per-board view: caller passes `boardId` directly. No picker.
//  - All-feedback view: caller passes `boards`. The dialog shows a
//    shadcn DropdownMenu so the visitor picks the target board before
//    submitting.
type SubmitPostDialogProps = {
  workspaceId: string
  workspaceOwnerId: string
} & (
  | { boardId: string; boards?: never }
  | { boardId?: never; boards: BoardOption[] }
)

export function SubmitPostDialog(props: SubmitPostDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [identityOpen, setIdentityOpen] = useState(false)

  // Picker state — only relevant in the all-feedback path. Defaults to
  // the first board so a visitor can submit immediately without
  // touching the dropdown if they don't care which board the post
  // lands in. Per-board path ignores this entirely.
  const initialBoard = props.boards?.[0] ?? null
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(
    initialBoard?.id ?? null,
  )

  const identityCtx = useVisitorIdentity({
    workspaceId: props.workspaceId,
    workspaceOwnerId: props.workspaceOwnerId,
  })
  const createMutation = useCreatePostMutation()

  // Resolve the target board id at submit time so the picker change
  // applies even when the user toggles between boards mid-form.
  function resolveBoardId(): string | null {
    if (props.boardId) return props.boardId
    return selectedBoardId
  }

  async function performSubmit() {
    const boardId = resolveBoardId()
    if (!boardId) {
      setError("Pick a board to submit to.")
      return
    }
    await createMutation.mutateAsync({
      boardId,
      title: title.trim(),
      description: description.trim(),
    })
    setTitle("")
    setDescription("")
    setOpen(false)
    router.refresh()
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!resolveBoardId()) {
      setError("Pick a board to submit to.")
      return
    }
    startTransition(async () => {
      try {
        const result = await identityCtx.ensure()
        if (result.kind === "modal") {
          setIdentityOpen(true)
          return
        }
        await performSubmit()
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Something went wrong",
        )
      }
    })
  }

  const selectedBoard =
    props.boards?.find((b) => b.id === selectedBoardId) ?? null

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Submit post</Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit a post</DialogTitle>
            <DialogDescription>
              Share a feature request or idea for the team to review.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {props.boards ? (
              <div className="flex flex-col gap-1.5">
                <Label>
                  Board <span className="text-destructive">*</span>
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2 shrink-0 rounded-full bg-emerald-500"
                          aria-hidden
                        />
                        {selectedBoard?.name ?? "Pick a board"}
                      </span>
                      <ChevronDown
                        className="size-3.5 text-muted-foreground"
                        aria-hidden
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[var(--radix-dropdown-menu-trigger-width)]"
                  >
                    {props.boards.map((b) => (
                      <DropdownMenuItem
                        key={b.id}
                        onSelect={() => setSelectedBoardId(b.id)}
                        className="flex items-center gap-2"
                      >
                        <span
                          className="size-2 shrink-0 rounded-full bg-emerald-500"
                          aria-hidden
                        />
                        {b.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="post-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="post-title"
                required
                minLength={3}
                maxLength={140}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's the request?"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="post-description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="post-description"
                required
                minLength={1}
                maxLength={4000}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Context, expected behavior, links…"
              />
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" disabled={isPending} className="mt-1 w-full">
              {isPending ? "Submitting…" : "Submit post"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <IdentityModal
        open={identityOpen}
        onOpenChange={setIdentityOpen}
        workspaceId={props.workspaceId}
        intent="submit"
        onIdentified={(v) => {
          identityCtx.setIdentity(v)
          // Resume the submit they originally triggered.
          startTransition(async () => {
            try {
              await performSubmit()
            } catch (err) {
              setError(
                err instanceof ApiError ? err.message : "Something went wrong",
              )
            }
          })
        }}
      />
    </>
  )
}
