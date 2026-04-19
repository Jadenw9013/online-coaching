import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://steadfast-coaching.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/coach/",
        "/client/",
        "/dashboard/",
        "/onboarding/",
        "/invite/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
