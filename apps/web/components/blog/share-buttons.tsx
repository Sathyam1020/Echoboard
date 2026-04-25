"use client"

import { Button } from "@workspace/ui/components/button"
import { Check, Copy } from "lucide-react"
import { useState } from "react"

// Three share buttons: copy URL, X/Twitter, LinkedIn. We don't include
// Facebook (low signal for B2B SaaS audience) or generic email (most
// browsers handle email links via the OS default which adds friction).
//
// `url` is passed in absolute since `window.location` isn't available
// during SSG. The post page resolves it via SITE_URL + slug.
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard write can fail if the page is loaded over plain http
      // outside localhost. Silent — the button still works on prod.
    }
  }

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[12px] font-medium text-muted-foreground">
        Share
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1.5 px-2.5 text-[12px] shadow-none"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy link"}
      >
        {copied ? (
          <Check className="size-3.5" aria-hidden />
        ) : (
          <Copy className="size-3.5" aria-hidden />
        )}
        {copied ? "Copied" : "Copy link"}
      </Button>
      <Button
        asChild
        size="sm"
        variant="outline"
        className="h-7 px-2.5 text-[12px] shadow-none"
      >
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X"
        >
          Share on X
        </a>
      </Button>
      <Button
        asChild
        size="sm"
        variant="outline"
        className="h-7 px-2.5 text-[12px] shadow-none"
      >
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on LinkedIn"
        >
          LinkedIn
        </a>
      </Button>
    </div>
  )
}
