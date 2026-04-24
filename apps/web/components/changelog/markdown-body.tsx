import ReactMarkdown from "react-markdown"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"

// Prose-friendly markdown renderer. Sanitized at render time — user-authored
// content, so we never trust it enough to ship raw HTML through.
export function MarkdownBody({ children }: { children: string }) {
  return (
    <div className="prose prose-sm max-w-none text-[14px] leading-relaxed text-foreground prose-headings:font-medium prose-headings:-tracking-[0.01em] prose-a:text-primary prose-strong:font-medium prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-[12.5px] prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
