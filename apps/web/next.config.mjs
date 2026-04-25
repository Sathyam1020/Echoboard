// Production guard: every canonical URL, OG image URL, sitemap entry, and
// JSON-LD `url` field is derived from NEXT_PUBLIC_SITE_URL. If it's unset
// in prod, all of those silently point at localhost and Google ignores
// them. Fail the build instead of letting that ship.
if (
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_SITE_URL
) {
  throw new Error(
    "NEXT_PUBLIC_SITE_URL is required in production. Set it in your deployment environment (e.g. Vercel project settings) to your live domain — no trailing slash.",
  )
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/auth", "@workspace/db"],
}

export default nextConfig
