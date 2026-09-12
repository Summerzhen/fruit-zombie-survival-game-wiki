export const dynamicParams = false;

import type { Metadata } from "next";
import { JsonLd, WikiSidebar } from "@/components/site";
import { getAllContent, getDynamicNavigation, type ContentItem, CONTENT_TYPES } from "@/lib/content";
import { routing, type Locale } from "@/i18n/routing";
import en from "@/locales/en.json";
import { getStaticMessages } from "@/lib/messages";
import { languageAlternates, localizedPathname, localizedUrl } from "@/lib/seo-routes";
import HomePageClient from "./HomePageClient";
import { GAME_SITE_CONFIG, SITE_URL, absoluteAsset } from "@/config/game-site";

type Messages = typeof en;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale as Locale;
  const messages = getStaticMessages(locale) as Messages;
  const canonical = localizedPathname("/", loc);
  return {
    title: messages.home.meta.title,
    description: messages.home.meta.description,
    alternates: { canonical, languages: languageAlternates("/") },
    openGraph: { title: messages.home.meta.title, description: messages.home.meta.description, url: localizedUrl(SITE_URL, "/", loc), locale: "en_US", images: [absoluteAsset(GAME_SITE_CONFIG.media.socialImage)] },
  };
}

export default async function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale as Locale;
  const messages = getStaticMessages(locale) as Messages;
  const webSite = { "@context": "https://schema.org", "@type": "WebSite", name: GAME_SITE_CONFIG.brand.wikiName, url: localizedUrl(SITE_URL, "/", loc), description: messages.home.meta.description };

  // 动态加载所有 content 目录下的文章
  const allArticles: ContentItem[] = (
    await Promise.all(CONTENT_TYPES.map((contentType) => getAllContent(contentType, loc)))
  ).flat();

  // 取最近更新的 8 篇文章（按 date 倒序）
  const recentArticles = [...allArticles]
    .sort((a, b) => {
      const dateA = a.metadata.lastModified || a.metadata.date;
      const dateB = b.metadata.lastModified || b.metadata.date;
      return dateB.localeCompare(dateA);
    })
    .slice(0, 8);

  const navGroups = getDynamicNavigation(loc);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <JsonLd data={webSite} />
      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_232px]">
        <HomePageClient home={messages.home} locale={locale} articles={allArticles} recentArticles={recentArticles} />
        <WikiSidebar locale={locale} navGroups={navGroups} currentPath="/" />
      </div>
    </main>
  );
}
