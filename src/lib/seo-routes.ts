import { routing, type Locale } from "@/i18n/routing";

function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") return "";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

/**
 * Default-locale English URLs are canonical without `/en`.
 * Other locales keep their locale segment.
 */
export function localizedPathname(pathname: string, locale: Locale) {
  const normalizedPathname = normalizePathname(pathname);
  const routePath = normalizedPathname === "" ? "/" : normalizedPathname;
  if (locale === routing.defaultLocale) return routePath;
  return `/${locale}${normalizedPathname}`;
}

export function languageAlternates(pathname: string, availableLocales: readonly Locale[] = routing.locales) {
  const languages: Record<string, string> = Object.fromEntries(
    availableLocales.map((locale) => [locale, localizedPathname(pathname, locale)]),
  );

  if (availableLocales.includes(routing.defaultLocale)) {
    languages["x-default"] = localizedPathname(pathname, routing.defaultLocale);
  }
  return languages;
}

export function localizedUrl(siteUrl: string, pathname: string, locale: Locale) {
  const baseUrl = siteUrl.replace(/\/$/, "");
  const localizedPath = localizedPathname(pathname, locale);
  if (localizedPath === "/") return baseUrl;
  return `${baseUrl}${localizedPath.replace(/\/$/, "")}/`;
}
