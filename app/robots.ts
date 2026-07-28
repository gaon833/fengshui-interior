import type { MetadataRoute } from "next";
import site from "@/content/site.json";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = site.siteUrl || "https://fengshui-interior.pages.dev";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin/"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
