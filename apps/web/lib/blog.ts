import fs from "node:fs"
import path from "node:path"

import matter from "gray-matter"
import readingTime from "reading-time"

// Blog posts live in `content/blog/<slug>.mdx`. We parse frontmatter at
// build time (via `getAllPosts`) and the route handlers read from these
// utilities — no runtime DB call.
//
// Keeping this file the single read-from-disk surface means the rest of
// the blog code (index page, post page, RSS feed) is platform-agnostic.

const POSTS_DIR = path.join(process.cwd(), "content", "blog")

export type BlogFrontmatter = {
  title: string
  description: string
  /** ISO date `YYYY-MM-DD`. */
  publishedAt: string
  /** Optional ISO date for last meaningful update. */
  updatedAt?: string
  author: string
  /** Comma-separated category names, e.g. ["Comparisons", "Pricing"]. */
  tags?: string[]
  /** OG image override. Falls back to dynamic /og?title=... if absent. */
  image?: string
  /** Set true to keep a draft out of getAllPosts(). */
  draft?: boolean
}

export type BlogPost = {
  slug: string
  frontmatter: BlogFrontmatter
  content: string
  /** Reading time in minutes, rounded up. */
  readingMinutes: number
  /** Body word count — used in Article JSON-LD. */
  wordCount: number
}

function readPostFile(slug: string): BlogPost | null {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, "utf-8")
  const { data, content } = matter(raw)
  // gray-matter returns `data` as `{ [key: string]: any }`; assert here once
  // since downstream code relies on the shape — frontmatter shape is
  // enforced by the post author and a quick visual scan, not Zod.
  const frontmatter = data as BlogFrontmatter
  if (!frontmatter.title || !frontmatter.publishedAt) {
    throw new Error(
      `Blog post "${slug}" is missing required frontmatter (title, publishedAt).`,
    )
  }
  const stats = readingTime(content)
  return {
    slug,
    frontmatter,
    content,
    readingMinutes: Math.max(1, Math.round(stats.minutes)),
    wordCount: stats.words,
  }
}

/** All non-draft posts, sorted newest-first by publishedAt. */
export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(POSTS_DIR)) return []
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx"))
  const posts = files
    .map((f) => readPostFile(f.replace(/\.mdx$/, "")))
    .filter((p): p is BlogPost => p !== null && !p.frontmatter.draft)
  posts.sort((a, b) =>
    a.frontmatter.publishedAt < b.frontmatter.publishedAt ? 1 : -1,
  )
  return posts
}

export function getPost(slug: string): BlogPost | null {
  const post = readPostFile(slug)
  if (!post) return null
  if (post.frontmatter.draft) return null
  return post
}

/**
 * Pick up to N related posts: same tag overlap first, then most recent.
 * Excludes the post itself.
 */
export function getRelatedPosts(slug: string, max = 3): BlogPost[] {
  const all = getAllPosts()
  const me = all.find((p) => p.slug === slug)
  if (!me) return []
  const otherPosts = all.filter((p) => p.slug !== slug)
  const myTags = new Set(me.frontmatter.tags ?? [])
  const scored = otherPosts.map((p) => {
    const overlap = (p.frontmatter.tags ?? []).filter((t) => myTags.has(t))
      .length
    return { post: p, score: overlap }
  })
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.post.frontmatter.publishedAt < b.post.frontmatter.publishedAt
      ? 1
      : -1
  })
  return scored.slice(0, max).map((s) => s.post)
}

/** Headings parsed out of a post's markdown for the table-of-contents. */
export type TocEntry = { id: string; text: string; depth: 2 | 3 }

/**
 * Lightweight markdown-heading scanner. We only care about H2/H3, and we
 * mirror rehype-slug's slug-rule (lowercase + hyphen-separate) so the
 * generated `id`s match what rehype-autolink-headings will set.
 */
export function extractToc(content: string): TocEntry[] {
  const lines = content.split("\n")
  const out: TocEntry[] = []
  let inFence = false
  for (const raw of lines) {
    if (raw.trim().startsWith("```")) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(raw)
    if (!m) continue
    const depth = m[1]!.length === 2 ? 2 : 3
    const text = m[2]!.replace(/`/g, "").trim()
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
    out.push({ id, text, depth })
  }
  return out
}
