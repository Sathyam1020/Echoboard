import { getAllPosts } from "@/lib/blog"
import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from "@/lib/seo"

// Atom-flavored RSS 2.0 feed at /blog/feed.xml. Published in the
// `<head>` via the blog index page's `alternates.types["application/rss+xml"]`
// metadata, which most RSS readers auto-discover.
//
// Built at request time; cache lifetime in Next defaults to revalidate
// along with the post list. If we need to force a hard refresh, redeploy.

export const dynamic = "force-static"

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export function GET() {
  const posts = getAllPosts()
  const feedUrl = absoluteUrl("/blog/feed.xml")
  const blogUrl = absoluteUrl("/blog")
  const lastBuildDate =
    posts.length > 0
      ? new Date(posts[0]!.frontmatter.publishedAt).toUTCString()
      : new Date().toUTCString()

  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/blog/${post.slug}`)
      const pubDate = new Date(post.frontmatter.publishedAt).toUTCString()
      return `
    <item>
      <title>${escapeXml(post.frontmatter.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.frontmatter.description)}</description>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(post.frontmatter.author)}</author>
      ${(post.frontmatter.tags ?? [])
        .map((tag) => `<category>${escapeXml(tag)}</category>`)
        .join("")}
    </item>`
    })
    .join("")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${SITE_NAME} Blog`)}</title>
    <link>${blogUrl}</link>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(SITE_DEFAULT_DESCRIPTION)}</description>
    <language>en-US</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>${SITE_URL}</generator>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
