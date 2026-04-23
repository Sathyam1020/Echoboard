import { Fragment, type ReactNode } from "react"

const URL_REGEX = /\bhttps?:\/\/\S+/g

export function renderLinkifiedText(s: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let key = 0

  for (const match of s.matchAll(URL_REGEX)) {
    const start = match.index ?? 0
    const url = match[0]

    if (start > lastIndex) {
      nodes.push(
        <Fragment key={`t-${key++}`}>{s.slice(lastIndex, start)}</Fragment>,
      )
    }

    nodes.push(
      <a
        key={`l-${key++}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        {url}
      </a>,
    )

    lastIndex = start + url.length
  }

  if (lastIndex < s.length) {
    nodes.push(<Fragment key={`t-${key++}`}>{s.slice(lastIndex)}</Fragment>)
  }

  return nodes
}
