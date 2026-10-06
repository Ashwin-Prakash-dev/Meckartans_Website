import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Media in public/ is pre-optimised by scripts/build_media.py (WebP at fixed sizes), so pages use plain <img>.
  images: { unoptimized: true },
  // Inlined into server and client bundles alike, so both render the same year during hydration.
  env: { BUILD_YEAR: String(new Date().getFullYear()) },
}

export default nextConfig
