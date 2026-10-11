import type { NextConfig } from "next";

// Security headers sent with every page.
const securityHeaders = [
  // Do not let the browser guess file types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Nobody can show CodeMind AI inside another website (stops "clickjacking").
  { key: "X-Frame-Options", value: "DENY" },
  // Do not leak full page addresses to other websites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // We do not use the camera, microphone or location.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Only on the real (production) site: always use https.
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  // Do not tell the world which framework runs the site.
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Needed for GitHub Codespaces (the address changes). Vercel adds its own.
      allowedOrigins: ["localhost:3000", "*.app.github.dev"],
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
