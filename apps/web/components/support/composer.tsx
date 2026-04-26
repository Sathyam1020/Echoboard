"use client"

import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Loader2, Send } from "lucide-react"
import { useState } from "react"

import { useTypingSender } from "@/hooks/realtime/use-typing-sender"

const MAX_BODY = 4000

export function Composer({
  conversationId,
  onSend,
  disabled,
  placeholder = "Reply…",
  autoFocus = false,
}: {
  // When provided, the composer fires throttled typing events to the
  // other party while the user is typing. Optional so the same component
  // can be reused in surfaces where typing isn't relevant.
  conversationId?: string | null
  onSend: (body: string) => Promise<void> | void
  disabled?: boolean
  placeholder?: string
  autoFocus?: boolean
}) {
  const [body, setBody] = useState("")
  const [pending, setPending] = useState(false)
  const typing = useTypingSender(conversationId ?? null)

  async function submit() {
    const trimmed = body.trim()
    if (!trimmed || pending || disabled) return
    typing.stopNow()
    setPending(true)
    try {
      await onSend(trimmed)
      setBody("")
    } catch {
      // Toast already fired by the send mutation's onError. Keep the
      // body so the user can hit Enter again to retry.
    } finally {
      setPending(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter inserts a newline. Matches WhatsApp /
    // iMessage / Slack desktop — what most chat users expect.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void submit()
    }
  }

  const disabledCta = disabled || pending || body.trim().length === 0

  return (
    <div className="flex items-end gap-2 border-t border-border bg-card px-3 py-3">
      <Textarea
        value={body}
        onChange={(e) => {
          setBody(e.target.value.slice(0, MAX_BODY))
          typing.notifyKeystroke()
        }}
        onKeyDown={onKeyDown}
        onBlur={() => typing.stopNow()}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={1}
        className="min-h-[36px] resize-none text-[14px] leading-relaxed"
        disabled={disabled || pending}
      />
      <Button
        type="button"
        size="sm"
        onClick={submit}
        disabled={disabledCta}
        className="shrink-0"
        aria-label="Send"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
        ) : (
          <Send className="size-4" />
        )}
      </Button>
    </div>
  )
}
