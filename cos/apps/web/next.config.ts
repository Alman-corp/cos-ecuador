import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["@react-pdf/renderer", "lightningcss", "@tailwindcss/oxide", "@tailwindcss/node", "@tailwindcss/postcss"],
  distDir: process.env.NEXT_DIST_DIR || ".next",
}

export default nextConfig
