import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { JsonLd, SiteFooter, SiteHeader, WikiSidebar } from "@/components/site";
import type { SearchItem } from "@/components/site-search";
import { CONTENT_TYPES, getAllContent, getDynamicNavigation, type ContentItem } from "@/lib/content";
import { getStaticMessages } from "@/lib/messages";
import { languageAlternates } from "@/lib/seo-routes";
import en from "@/locales/en.json";
import HomePageClient from "../_locale_disabled/HomePageClient";
import { GAME_SITE_CONFIG, SITE_URL, absoluteAsset } from "@/config/game-site";
import { AdSlot, NativeContentAd } from "@/components/adsterra-ads";

type Messages = typeof en;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: en.home.meta.title,
  description: en.home.meta.description,
  alternates: {
    canonical: "/",
    languages: languageAlternates("/"),
  },
  openGraph: {
    type: "website",
    title: en.home.meta.title,
    description: en.home.meta.description,
    url: SITE_URL,
    locale: "en_US",
    siteName: GAME_SITE_CONFIG.brand.wikiName,
    images: [absoluteAsset(GAME_SITE_CONFIG.media.socialImage)],
  },
  twitter: { card: "summary_large_image", images: [absoluteAsset(GAME_SITE_CONFIG.media.socialImage)] },
};

export default async function RootPage() {
  const locale = "en";
  const messages = getStaticMessages(locale) as Messages;
  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: messages.site.name,
    url: SITE_URL,
    description: messages.home.meta.description,
  };
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: GAME_SITE_CONFIG.brand.wikiName,
    url: SITE_URL,
    logo: absoluteAsset(GAME_SITE_CONFIG.media.logo),
    image: absoluteAsset(GAME_SITE_CONFIG.media.socialImage),
  };

  const allArticles: ContentItem[] = (
    await Promise.all(CONTENT_TYPES.map((contentType) => getAllContent(contentType, locale)))
  ).flat();

  const recentArticles = [...allArticles]
    .sort((a, b) => {
      const dateA = a.metadata.lastModified || a.metadata.date;
      const dateB = b.metadata.lastModified || b.metadata.date;
      return dateB.localeCompare(dateA);
    })
    .slice(0, 8);
  const searchItems: SearchItem[] = allArticles.map((item) => ({
    title: item.metadata.title,
    description: item.metadata.description,
    contentType: item.contentType,
    href: `/${item.contentType}/${item.slug}`,
  }));
  const navGroups = getDynamicNavigation(locale);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <JsonLd data={organization} />
        <SiteHeader locale={locale} searchItems={searchItems} />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <JsonLd data={webSite} />
          <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_232px]">
            <HomePageClient home={messages.home} locale={locale} articles={allArticles} recentArticles={recentArticles} />
            <WikiSidebar locale={locale} navGroups={navGroups} currentPath="/" />
          </div>
        </main>
        <SiteFooter locale={locale} />
      </ThemeProvider>
    </div>
  );
}
