import type { MetadataRoute } from "next"

import { getVerifiedCompetitors } from "@/content/alternatives"
import { getVerifiedComparisons } from "@/content/comparisons"
import { getAllUseCases } from "@/content/use-cases"
import { getAllPosts } from "@/lib/blog"
import { absoluteUrl } from "@/lib/seo"

// Auto-served at `/sitemap.xml`. The static-page list lives inline; pSEO
// detail pages are pulled from their content files so adding a competitor,
// comparison, or use case automatically grows the sitemap. Blog posts will
// be added in Phase 4 once the MDX index exists.
//
// Keep `lastModified` as a real `Date` — Next serializes to ISO 8601 for
// us. `changeFrequency` is a hint, not a guarantee.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/alternatives"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/compare"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/for"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ]

  const alternativeEntries: MetadataRoute.Sitemap = getVerifiedCompetitors()
    .filter((c) => c.slug !== "echoboard")
    .map((c) => ({
      url: absoluteUrl(`/alternatives/${c.slug}`),
      lastModified: c.verifiedAt ? new Date(c.verifiedAt) : now,
      changeFrequency: "monthly",
      priority: 0.7,
    }))

  const compareEntries: MetadataRoute.Sitemap = getVerifiedComparisons().map(
    (c) => ({
      url: absoluteUrl(`/compare/${c.slug}`),
      lastModified: c.verifiedAt ? new Date(c.verifiedAt) : now,
      changeFrequency: "monthly",
      priority: 0.6,
    }),
  )

  const useCaseEntries: MetadataRoute.Sitemap = getAllUseCases().map((uc) => ({
    url: absoluteUrl(`/for/${uc.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  const blogEntries: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(
      post.frontmatter.updatedAt ?? post.frontmatter.publishedAt,
    ),
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  return [
    ...staticEntries,
    ...alternativeEntries,
    ...compareEntries,
    ...useCaseEntries,
    ...blogEntries,
  ]
}
