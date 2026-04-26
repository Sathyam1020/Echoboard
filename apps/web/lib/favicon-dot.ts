"use client"

// Draws a small red dot on the top-right of the page favicon when there
// are unread messages, restores the original favicon when cleared.
// Implementation: render the original favicon to a canvas, paint a
// 7px red circle, encode as data URL, swap <link rel="icon">.
//
// Behaviour is best-effort — if the original favicon fails CORS / 404 /
// load, we skip silently. Browsers vary in which favicon link variants
// they actually pick up; we update every <link rel="icon"> tag we find.

const ICON_SIZE = 32

let originalHrefByLink = new WeakMap<HTMLLinkElement, string>()
let dotEnabled = false

function getIconLinks(): HTMLLinkElement[] {
  if (typeof document === "undefined") return []
  return Array.from(
    document.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"]',
    ),
  )
}

function ensureOriginalCached(): void {
  for (const link of getIconLinks()) {
    if (!originalHrefByLink.has(link)) {
      originalHrefByLink.set(link, link.href)
    }
  }
}

async function buildDottedIcon(sourceHref: string): Promise<string | null> {
  if (typeof document === "undefined") return null
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = ICON_SIZE
        canvas.height = ICON_SIZE
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0, ICON_SIZE, ICON_SIZE)
        // Red dot top-right.
        const r = 7
        const cx = ICON_SIZE - r - 1
        const cy = r + 1
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = "#ef4444"
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.fill()
        ctx.stroke()
        resolve(canvas.toDataURL("image/png"))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = sourceHref
  })
}

export async function setFaviconDot(showDot: boolean): Promise<void> {
  if (typeof document === "undefined") return
  ensureOriginalCached()
  if (showDot && !dotEnabled) {
    const links = getIconLinks()
    for (const link of links) {
      const original = originalHrefByLink.get(link)
      if (!original) continue
      const next = await buildDottedIcon(original)
      if (next) link.href = next
    }
    dotEnabled = true
    return
  }
  if (!showDot && dotEnabled) {
    for (const link of getIconLinks()) {
      const original = originalHrefByLink.get(link)
      if (original) link.href = original
    }
    dotEnabled = false
  }
}
