"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALE_ROUTES } from "@/config/locale-routes";
import { getStaticNamespace } from "@/lib/messages";
import { Check, Globe } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOCALE_LABELS = Object.fromEntries(routing.locales.map(loc => [loc, new Intl.DisplayNames([loc], {type: "language"}).of(loc) || loc]));

/**
 * 语言切换器（下拉菜单版）：点击 Globe 图标展开所有语言列表
 * 当前语言显示 ✓ 标记，选择后跳转对应语言路径
 * 支持 2+ 个语言，扩展时只需在 routing.ts 添加 locale 即可
 */
export function LanguageSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const shared = getStaticNamespace(locale, "shared") as Record<string, string>;
  const basePath = (pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "") || "/").replace(/\/$/, "") || "/";
  const available = (loc: string) => (LOCALE_ROUTES[loc] || []).includes(basePath);

  if (!routing.locales.includes(locale as Locale)) return null;
  if (routing.locales.length <= 1) return null;

  const handleSwitch = (nextLocale: Locale) => {
    if (nextLocale === locale || !available(nextLocale)) return;

    let newPath = pathname;

    // Remove the current locale prefix before adding the next one.
    newPath = newPath.replace(new RegExp(`^/${locale}(?=/|$)`), "") || "/";

    // English is canonical without `/en`; other locales keep their prefix.
    newPath = nextLocale === routing.defaultLocale
      ? newPath
      : `/${nextLocale}${newPath === "/" ? "" : newPath}`;

    // Store the selected locale for client-side navigation.
    document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;

    router.push(newPath + window.location.search + window.location.hash);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <Globe className="h-4 w-4" />
          <span>{LOCALE_LABELS[locale as Locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            disabled={!available(loc)}
            onClick={() => handleSwitch(loc)}
            className="flex items-center justify-between gap-3"
          >
            <span>{LOCALE_LABELS[loc]}{!available(loc) && ` — ${shared.translationUnavailable}`}</span>
            {loc === (locale as Locale) && <Check className="h-4 w-4 text-[hsl(var(--nav-theme))]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
