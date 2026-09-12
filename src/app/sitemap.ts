import type { MetadataRoute } from "next";
import { getAllContentPaths } from "@/lib/content";
import { CONTENT_TYPES } from "@/config/navigation";
import { routing } from "@/i18n/routing";
import { localizedUrl } from "@/lib/seo-routes";
import { SITE_URL } from "@/config/game-site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "/",
    ...CONTENT_TYPES.map((contentType) => `/${contentType}`),
    "/privacy-policy",
    "/terms-of-service",
    "/copyright",
    "/about",
  ];

  const pathsByLocale = new Map(
    await Promise.all(
      routing.locales.map(async (locale) => {
        const contentPaths = await getAllContentPaths(locale);
        const dynamicPaths = contentPaths.map((item) => `/${[item.contentType, ...item.slug].join("/")}`);
        return [locale, new Set([...staticPaths, ...dynamicPaths])] as const;
      }),
    ),
  );

  return routing.locales.flatMap((locale) =>
    [...(pathsByLocale.get(locale) ?? [])].map((path) => {
      const languages: Record<string, string> = {};
      for (const alternateLocale of routing.locales) {
        if (pathsByLocale.get(alternateLocale)?.has(path)) {
          languages[alternateLocale] = localizedUrl(SITE_URL, path, alternateLocale);
        }
      }
      if (pathsByLocale.get(routing.defaultLocale)?.has(path)) {
        languages["x-default"] = localizedUrl(SITE_URL, path, routing.defaultLocale);
      }

      return {
        url: localizedUrl(SITE_URL, path, locale),
        lastModified: new Date(),
        changeFrequency: path === "/" ? ("daily" as const) : ("weekly" as const),
        priority: path === "/" ? 1 : CONTENT_TYPES.some((contentType) => path === `/${contentType}`) ? 0.8 : 0.6,
        alternates: { languages },
      };
    }),
  );
}
