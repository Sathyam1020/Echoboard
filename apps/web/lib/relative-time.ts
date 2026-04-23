const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })

export function formatRelativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then

  if (diff < MINUTE) return "just now"
  if (diff < HOUR) return rtf.format(-Math.floor(diff / MINUTE), "minute")
  if (diff < DAY) return rtf.format(-Math.floor(diff / HOUR), "hour")
  if (diff < WEEK) return rtf.format(-Math.floor(diff / DAY), "day")

  return formatAbsoluteDate(iso)
}

export function formatAbsoluteDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
