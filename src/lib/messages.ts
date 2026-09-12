import { routing, type Locale } from "@/i18n/routing";
import en from "@/locales/en.json";


export type Messages = typeof en;

const messagesMap: Record<Locale, Partial<Messages>> = {
  en,
};

function deepMerge<T>(base: T, override: Partial<T>): T {
  if (typeof base !== "object" || base === null || typeof override !== "object" || override === null) {
    return (override as T) ?? base;
  }
  if (Array.isArray(base)) {
    return (Array.isArray(override) ? override : base) as T;
  }
  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(override as Record<string, unknown>)) {
    const baseValue = (base as Record<string, unknown>)[key];
    const overrideValue = (override as Record<string, unknown>)[key];
    if (overrideValue === undefined) continue;
    result[key] = deepMerge(baseValue as never, overrideValue as never);
  }
  return result as T;
}

export function getStaticMessages(locale: string): Messages {
  const selected = (routing.locales.includes(locale as Locale) ? locale : routing.defaultLocale) as Locale;
  return deepMerge(en, messagesMap[selected] ?? {});
}

export function getStaticNamespace<N extends keyof Messages>(locale: string, namespace: N): Messages[N] {
  return getStaticMessages(locale)[namespace];
}
