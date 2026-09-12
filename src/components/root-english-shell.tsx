import { ThemeProvider } from "next-themes";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/site";
import type { SearchItem } from "@/components/site-search";
import { CONTENT_TYPES, getAllContent } from "@/lib/content";
import { GAME_SITE_CONFIG, SITE_URL, absoluteAsset } from "@/config/game-site";

export async function RootEnglishShell({ children }: { children: React.ReactNode }) {
  const locale = "en";
  const content = (await Promise.all(CONTENT_TYPES.map((contentType) => getAllContent(contentType, locale)))).flat();
  const searchItems: SearchItem[] = content.map((item) => ({
    title: item.metadata.title,
    description: item.metadata.description,
    contentType: item.contentType,
    href: `/${item.contentType}/${item.slug}`,
  }));
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: GAME_SITE_CONFIG.brand.wikiName,
    url: SITE_URL,
    logo: absoluteAsset(GAME_SITE_CONFIG.media.logo),
    image: absoluteAsset(GAME_SITE_CONFIG.media.socialImage),
  };
  return (
    <div lang="en">
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <JsonLd data={organization} />
        <SiteHeader locale={locale} searchItems={searchItems} />
        {children}
        <SiteFooter locale={locale} />
      </ThemeProvider>
    </div>
  );
}
