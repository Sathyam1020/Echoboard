export type MarkdownAction =
  | "bold"
  | "italic"
  | "h1"
  | "h2"
  | "list"
  | "link"
  | "code"

type Result = { value: string; selectionStart: number; selectionEnd: number }

// Wraps the selection (or a placeholder, if empty) with the given prefix/suffix.
// If the selection already has the wrap, removes it instead.
function wrap(
  value: string,
  start: number,
  end: number,
  prefix: string,
  suffix: string,
  placeholder: string,
): Result {
  const before = value.slice(0, start)
  const selection = value.slice(start, end)
  const after = value.slice(end)

  // Toggle: if the selection is already wrapped, unwrap it.
  if (
    selection.startsWith(prefix) &&
    selection.endsWith(suffix) &&
    selection.length >= prefix.length + suffix.length
  ) {
    const inner = selection.slice(prefix.length, selection.length - suffix.length)
    const next = before + inner + after
    return {
      value: next,
      selectionStart: start,
      selectionEnd: start + inner.length,
    }
  }

  const body = selection.length > 0 ? selection : placeholder
  const next = before + prefix + body + suffix + after
  // If the user had a selection, keep it selected post-wrap. Otherwise
  // select the placeholder so they can immediately type over it.
  const selStart = selection.length > 0 ? start + prefix.length : start + prefix.length
  const selEnd =
    selection.length > 0
      ? start + prefix.length + selection.length
      : start + prefix.length + body.length
  return { value: next, selectionStart: selStart, selectionEnd: selEnd }
}

// Ensures the line containing the cursor starts with `prefix`.
// Toggles off if the line already starts with it.
function prefixLine(
  value: string,
  start: number,
  end: number,
  prefix: string,
): Result {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1
  const lineEnd = value.indexOf("\n", end)
  const lineBoundEnd = lineEnd === -1 ? value.length : lineEnd
  const line = value.slice(lineStart, lineBoundEnd)

  // Strip any existing heading/list prefix so toggling between H1/H2/list
  // swaps cleanly rather than stacking (e.g. "## # foo").
  const alreadyHasSamePrefix = line.startsWith(prefix)
  const withoutAnyPrefix = line.replace(/^(#{1,6} |- |\* |\d+\. )/, "")
  const nextLine = alreadyHasSamePrefix ? withoutAnyPrefix : prefix + withoutAnyPrefix

  const nextValue =
    value.slice(0, lineStart) + nextLine + value.slice(lineBoundEnd)
  // Keep cursor at the same relative spot on the line.
  const delta = nextLine.length - line.length
  return {
    value: nextValue,
    selectionStart: start + delta,
    selectionEnd: end + delta,
  }
}

export function applyMarkdown(
  action: MarkdownAction,
  value: string,
  start: number,
  end: number,
): Result {
  switch (action) {
    case "bold":
      return wrap(value, start, end, "**", "**", "bold text")
    case "italic":
      return wrap(value, start, end, "_", "_", "italic text")
    case "code":
      return wrap(value, start, end, "`", "`", "code")
    case "link": {
      const sel = value.slice(start, end)
      const text = sel.length > 0 ? sel : "link text"
      const before = value.slice(0, start)
      const after = value.slice(end)
      const inserted = `[${text}](https://)`
      const next = before + inserted + after
      // Put the cursor inside the URL parens so the user can paste.
      const urlStart = before.length + `[${text}](`.length
      const urlEnd = urlStart + "https://".length
      return { value: next, selectionStart: urlStart, selectionEnd: urlEnd }
    }
    case "h1":
      return prefixLine(value, start, end, "# ")
    case "h2":
      return prefixLine(value, start, end, "## ")
    case "list":
      return prefixLine(value, start, end, "- ")
  }
}
