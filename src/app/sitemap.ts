import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const routes = ["/", "/projects", "/tasks", "/ideas", "/focus", "/review", "/radar"];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
  }));
}

