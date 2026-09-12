import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: true,
});

export const prefixedLocales = routing.locales.length === 1 ? [] : routing.locales.filter((locale) => locale !== routing.defaultLocale);

export type Locale = (typeof routing.locales)[number];
