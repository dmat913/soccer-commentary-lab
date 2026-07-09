import type { MetadataRoute } from "next";

import { getCanonicalUrl, SITEMAP_ROUTES } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_ROUTES.map((route) => ({
    url: getCanonicalUrl(route.path),
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
