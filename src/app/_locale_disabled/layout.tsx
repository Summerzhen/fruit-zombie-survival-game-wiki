import type { Metadata } from "next";
import "../globals.css";
import { Antonio, IBM_Plex_Mono, Manrope, Newsreader } from "next/font/google";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { JsonLd, SiteFooter, SiteHeader } from "@/components/site";
import type { SearchItem } from "@/components/site-search";
import { CONTENT_TYPES, getAllContent } from "@/lib/content";
import { routing, prefixedLocales } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import { GAME_SITE_CONFIG, SITE_URL, absoluteAsset } from "@/config/game-site";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const display = Antonio({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700"] });
const editorial = Newsreader({ subsets: ["latin"], variable: "--font-editorial", weight: ["500", "600", "700"] });
const utility = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-utility", weight: ["500", "600"] });

export function generateStaticParams() {
  return prefixedLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const image = absoluteAsset(GAME_SITE_CONFIG.media.socialImage);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: GAME_SITE_CONFIG.brand.wikiName, template: "%s" },
    description: `Guides, reference data, updates, and player-focused walkthroughs for ${GAME_SITE_CONFIG.brand.name}.`,
    openGraph: { type: "website", locale: "en_US", siteName: GAME_SITE_CONFIG.brand.wikiName, images: [{ url: image }] },
    twitter: { card: "summary_large_image", images: [image] },
    icons: { icon: [{ url: "/favicon.ico" }, { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }], apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }], other: [{ rel: "manifest", url: "/site.webmanifest" }] },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const content = (await Promise.all(CONTENT_TYPES.map((contentType) => getAllContent(contentType, locale as Locale)))).flat();
  const searchItems: SearchItem[] = content.map((item) => ({
    title: item.metadata.title,
    description: item.metadata.description,
    contentType: item.contentType,
    href: locale === "en" ? `/${item.contentType}/${item.slug}` : `/${locale}/${item.contentType}/${item.slug}`,
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
    <html lang={locale} data-game-theme="game" className={`${sans.variable} ${display.variable} ${editorial.variable} ${utility.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <JsonLd data={organization} />
        <SiteHeader locale={locale} searchItems={searchItems} />
        {children}
        <SiteFooter locale={locale} />
        </ThemeProvider>
      </body>
    </html>
  );
}
