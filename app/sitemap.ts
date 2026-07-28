import type { MetadataRoute } from "next";
import site from "@/content/site.json";
import { getProjects } from "@/lib/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = site.siteUrl || "https://fengshui-interior.pages.dev";
  const now = new Date();
  const staticPages = ["", "/studio", "/service", "/project", "/reservation"];

  return [
    ...staticPages.map((path) => ({
      url: `${baseUrl}${path}/`,
      lastModified: now,
      changeFrequency: path === "/project" ? "weekly" as const : "monthly" as const,
      priority: path === "" ? 1 : path === "/project" ? 0.9 : 0.7,
    })),
    ...getProjects().map((project) => ({
      url: `${baseUrl}/project/${project.slug}/`,
      lastModified: new Date(project.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
