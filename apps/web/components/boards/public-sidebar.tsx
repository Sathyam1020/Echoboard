"use client"

import { cn } from "@workspace/ui/lib/utils"
import { Link2, Share2 } from "lucide-react"
import { useState } from "react"

export function PublicSidebar({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <aside
      className={cn(
        // Sticky on lg+ so the card and Actions stay anchored below the top
        // bar as the visitor scrolls a long feed. `self-start` prevents the
        // flex parent from stretching the aside to match the main column
        // height (which would break sticky behavior visually).
        "flex flex-col gap-7 lg:sticky lg:top-20 lg:self-start",
        className,
      )}
    >
      {children}
      <PublicSidebarActions />
    </aside>
  )
}

function PublicSidebarActions() {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (typeof window === "undefined") return
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {})
  }

  function handleShare() {
    if (typeof window === "undefined") return
    if (typeof navigator.share === "function") {
      navigator
        .share({ url: window.location.href, title: document.title })
        .catch(() => {})
      return
    }
    handleCopy()
  }

  return (
    <div className="flex flex-col gap-3 px-1">
      <div className="text-[13px] font-medium text-foreground">Actions</div>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-2.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <Link2 className="size-3.5" aria-hidden />
        {copied ? "Copied!" : "Copy link"}
      </button>
      <button
        type="button"
        onClick={handleShare}
        className="flex items-center gap-2.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <Share2 className="size-3.5" aria-hidden />
        Share
      </button>
    </div>
  )
}
