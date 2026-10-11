import type { MetadataRoute } from "next";

// Search engines may index the landing page only, never the private app.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/assistant",
          "/editor",
          "/debugger",
          "/projects",
          "/history",
          "/settings",
          "/tools",
          "/auth/",
        ],
      },
    ],
  };
}
