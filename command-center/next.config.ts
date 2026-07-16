import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    const taxServiceUrl = process.env.TAX_SERVICE_URL || "http://localhost:8002"
    return [
      { source: "/api/v1/iva/:path*", destination: `${taxServiceUrl}/api/v1/iva/:path*` },
      { source: "/api/v1/retenciones/:path*", destination: `${taxServiceUrl}/api/v1/retenciones/:path*` },
      { source: "/api/v1/renta/:path*", destination: `${taxServiceUrl}/api/v1/renta/:path*` },
      { source: "/api/v1/anexos/:path*", destination: `${taxServiceUrl}/api/v1/anexos/:path*` },
      { source: "/api/v1/cruces/:path*", destination: `${taxServiceUrl}/api/v1/cruces/:path*` },
    ]
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https:;",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  telemetry: false,
});
