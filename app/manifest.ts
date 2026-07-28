import type { MetadataRoute } from "next";
import site from "@/content/site.json";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.brandName,
    short_name: site.brandName,
    description: site.seo.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "ko",
    icons: [
      { src: "/logo/brand-logo.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
