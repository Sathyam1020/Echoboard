/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/auth", "@workspace/db"],
}

export default nextConfig
