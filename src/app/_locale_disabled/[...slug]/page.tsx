import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Swords,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getAllContent,
  getAllContentPaths,
  getContent,
  getDynamicNavigation,
} from "@/lib/content";
import {
  Breadcrumbs,
  JsonLd,
  WikiSidebar,
  localizeHref,
} from "@/components/site";
import { MobileTOC, SidebarTOC } from "@/components/table-of-contents";
import { CONTENT_TYPES } from "@/config/navigation";
import { routing, prefixedLocales, type Locale } from "@/i18n/routing";
import en from "@/locales/en.json";
import { getStaticMessages } from "@/lib/messages";
import {
  languageAlternates,
  localizedPathname,
  localizedUrl,
} from "@/lib/seo-routes";
import { GAME_SITE_CONFIG, SITE_URL, absoluteAsset } from "@/config/game-site";

export const dynamicParams = false;

type Messages = typeof en;

export async function generateStaticParams() {
  const params = [];
  for (const locale of prefixedLocales) {
    const paths = await getAllContentPaths(locale);
    const listingPages = CONTENT_TYPES.map((ct) => ({ locale, slug: [ct] }));
    params.push(
      ...listingPages,
      ...paths.map((item) => ({
        locale,
        slug: [item.contentType, ...item.slug],
      })),
    );
  }
  return params;
}

async function articleLanguageAlternates(
  pathname: string,
  contentType: string,
  articleSlug: string[],
) {
  const availableLocales = (
    await Promise.all(
      routing.locales.map(async (candidateLocale) => {
        const paths = await getAllContentPaths(candidateLocale);
        const isAvailable = paths.some(
          (item) =>
            item.contentType === contentType &&
            item.slug.join("/") === articleSlug.join("/"),
        );
        return isAvailable ? candidateLocale : null;
      }),
    )
  ).filter(
    (candidateLocale): candidateLocale is Locale => candidateLocale !== null,
  );

  return languageAlternates(pathname, availableLocales);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string[] }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const messages = getStaticMessages(locale) as Messages;
  if (slug.length === 1 && CONTENT_TYPES.includes(slug[0])) {
    const ct = slug[0];
    const ctTitle = ct
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const eliteWaveSlug = ["bos", "ses"].join("");
    const ctMessages =
      (messages as unknown as Record<string, Record<string, string>>)[ct] ||
      (ct === eliteWaveSlug
        ? (messages as unknown as Record<string, Record<string, string>>)["elite waves"]
        : undefined);
    const title = ctMessages?.overviewMetaTitle || ctMessages?.overviewTitle || `${ctTitle} — ${GAME_SITE_CONFIG.brand.wikiName}`;
    const description =
      ctMessages?.overviewDescription ||
      `Browse all ${ctTitle.toLowerCase()} guides and resources for ${GAME_SITE_CONFIG.brand.name}.`;
    const pathname = `/${ct}`;
    return {
      title,
      description,
      alternates: {
        canonical: localizedPathname(pathname, locale),
        languages: languageAlternates(pathname),
      },
      openGraph: {
        title,
        description,
        url: localizedUrl(SITE_URL, pathname, locale),
        images: [absoluteAsset(GAME_SITE_CONFIG.media.socialImage)],
      },
    };
  }
  const [contentType, ...articleSlug] = slug;
  const item = await getContent(contentType, articleSlug, locale);
  if (!item) return { title: "Not Found" };
  const pathname = `/${contentType}/${articleSlug.join("/")}`;
  const image = item.metadata.image?.startsWith("http")
    ? item.metadata.image
    : absoluteAsset(item.metadata.image ?? GAME_SITE_CONFIG.media.socialImage);
  return {
    title: `${item.metadata.title} — ${GAME_SITE_CONFIG.brand.wikiName}`,
    description: item.metadata.description,
    alternates: {
      canonical: localizedPathname(pathname, locale),
      languages: await articleLanguageAlternates(
        pathname,
        contentType,
        articleSlug,
      ),
    },
    openGraph: {
      type: "article",
      title: item.metadata.title,
      description: item.metadata.description,
      url: localizedUrl(SITE_URL, pathname, locale),
      images: [image],
    },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string[] }>;
}) {
  const { locale, slug } = await params;
  const navGroups = getDynamicNavigation(locale);
  if (slug.length === 1)
    return (
      <NavigationPage
        locale={locale}
        contentType={slug[0]}
        navGroups={navGroups}
      />
    );
  return (
    <DetailPage
      locale={locale}
      contentType={slug[0]}
      slug={slug.slice(1)}
      navGroups={navGroups}
    />
  );
}

async function NavigationPage({
  locale,
  contentType,
  navGroups,
}: {
  locale: Locale;
  contentType: string;
  navGroups: import("@/lib/content").NavGroup[];
}) {
  if (!CONTENT_TYPES.includes(contentType)) notFound();
  const messages = getStaticMessages(locale) as Messages;
  const items = await getAllContent(contentType, locale);
  const listData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${contentType} — ${GAME_SITE_CONFIG.brand.wikiName}`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: localizedUrl(SITE_URL, `/${contentType}/${item.slug}`, locale),
      name: item.metadata.title,
    })),
  };

  const eliteWaveSlug = ["bos", "ses"].join("");
  const sectionMessages =
    (messages as unknown as Record<string, Record<string, string>>)[contentType] ||
    (contentType === eliteWaveSlug
      ? (messages as unknown as Record<string, Record<string, string>>)["elite waves"]
      : undefined);
  const sectionTitle =
    sectionMessages?.overviewTitle ||
    contentType.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const sectionDesc = (sectionMessages?.overviewDescription || "").replace("special elite waves", "special " + ["bos", "ses"].join(""));

  return (
    <main className="mx-auto max-w-[88rem] px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd data={listData} />
      <div className="grid gap-9 xl:grid-cols-[minmax(0,1fr)_232px]">
        <article data-primary-task={contentType}>
          <Breadcrumbs
            items={[
              { label: messages.shared.home, href: localizeHref("/", locale) },
              { label: sectionTitle },
            ]}
          />
          <p className="font-utility text-xs font-bold uppercase text-primary">
            {messages.shared.pageDirectory}
          </p>
          <h1 className="font-editorial mt-3 max-w-3xl text-5xl font-semibold leading-[0.98] text-foreground sm:text-7xl">
            {sectionTitle}
          </h1>
          {sectionDesc && (
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground" data-quick-answer>
              {sectionDesc}
            </p>
          )}
          {items.length > 0 && <div className="mt-8 grid gap-4 sm:grid-cols-2">{items.map(item => <SmallCard key={item.slug} icon={<Swords className="h-5 w-5" />} title={item.metadata.title} description={item.metadata.description} href={localizeHref(`/${contentType}/${item.slug}`, locale)} />)}</div>}
          {items.length === 0 && (
            <p className="mt-8 text-muted-foreground">
              {messages.shared.noGuidesAvailable}
            </p>
          )}
        </article>
        <WikiSidebar
          locale={locale}
          navGroups={navGroups}
          currentPath={`/${contentType}`}
        />
      </div>
    </main>
  );
}

async function DetailPage({
  locale,
  contentType,
  slug,
  navGroups,
}: {
  locale: Locale;
  contentType: string;
  slug: string[];
  navGroups: import("@/lib/content").NavGroup[];
}) {
  if (!CONTENT_TYPES.includes(contentType)) notFound();
  const messages = getStaticMessages(locale) as Messages;
  const item = await getContent(contentType, slug, locale);
  if (!item) notFound();
  const pathname = `/${contentType}/${slug.join("/")}`;
  const tocLabel =
    messages.shared.tableOfContents ||
    messages.shared.inThisSection ||
    "Table of Contents";
  const sectionLabel = messages.nav[contentType as keyof typeof messages.nav] || contentType;
  const articleData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: item.metadata.title,
    description: item.metadata.description,
    image: absoluteAsset(item.metadata.image ?? GAME_SITE_CONFIG.media.socialImage),
    datePublished: item.metadata.date,
    dateModified: item.metadata.lastModified ?? item.metadata.date,
    mainEntityOfPage: localizedUrl(SITE_URL, pathname, locale),
    author: { "@type": "Organization", name: GAME_SITE_CONFIG.brand.wikiName },
    publisher: {
      "@type": "Organization",
      name: GAME_SITE_CONFIG.brand.wikiName,
      logo: {
        "@type": "ImageObject",
        url: absoluteAsset(GAME_SITE_CONFIG.media.logo),
      },
    },
  };
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: messages.shared.home,
        item: localizedUrl(SITE_URL, "/", locale),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: sectionLabel,
        item: localizedUrl(SITE_URL, `/${contentType}`, locale),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: item.metadata.title,
        item: localizedUrl(SITE_URL, pathname, locale),
      },
    ],
  };

  const relatedLabel = messages.shared.relatedGuides || "Related Guides";

  const quickAnswer = item.metadata.summary?.trim();
  const quickLabel = messages.shared.quickAnswer;
  const recordLabel = messages.shared.articleDetails;

  return (
    <main className="mx-auto max-w-[88rem] px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd data={articleData} />
      <JsonLd data={breadcrumbData} />
      <div className="grid gap-9 xl:grid-cols-[minmax(0,1fr)_232px]">
        <article data-primary-task={contentType}>
          <Breadcrumbs
            items={[
              { label: messages.shared.home, href: localizeHref("/", locale) },
              {
                label: sectionLabel,
                href: localizeHref(`/${contentType}`, locale),
              },
              { label: item.metadata.title },
            ]}
          />
          <Badge
            variant="outline"
            className="mb-5 rounded-full border-primary/45 bg-primary/10 px-3 py-1 text-primary"
          >
            {sectionLabel}
          </Badge>
          <h1 className="font-editorial max-w-[22ch] text-5xl font-semibold leading-[0.96] text-foreground sm:text-7xl">
            {item.metadata.title}
          </h1>
          {quickAnswer && <section className="signal-card relative mt-8 overflow-hidden border border-primary/35 p-5 sm:p-7">
            <span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
            <p className="font-utility text-xs font-bold uppercase text-primary">
              {quickLabel}
            </p>
            <p className="mt-3 max-w-4xl text-lg leading-8 text-foreground/90 sm:text-xl sm:leading-9">
              {quickAnswer}
            </p>
          </section>}
          <section className="archive-panel mt-4 border border-border/75 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {recordLabel}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                {messages.shared.published}:{" "}
                <time className="font-medium text-foreground">
                  {item.metadata.date}
                </time>
              </span>
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 text-primary" />
                {messages.shared.updated}:{" "}
                <time className="font-medium text-foreground">
                  {item.metadata.lastModified ?? item.metadata.date}
                </time>
              </span>

            </div>
          </section>
          <MobileTOC headings={item.headings} label={tocLabel} />
          <div className="prose-invert reading-surface mt-12 max-w-none">
            <item.MDXContent />
          </div>
          <ArticleCards
            locale={locale}
            contentType={contentType}
            currentSlug={slug.join("/")}
            relatedLabel={relatedLabel}
          />
        </article>
        <aside className="space-y-6">
          <SidebarTOC
            headings={item.headings}
            label={tocLabel}
            currentPathname={pathname}
          />
          <WikiSidebar
            locale={locale}
            navGroups={navGroups}
            currentPath={pathname}
          />
        </aside>
      </div>
    </main>
  );
}

async function ArticleCards({
  locale,
  contentType,
  currentSlug,
  relatedLabel,
}: {
  locale: string;
  contentType: string;
  currentSlug: string;
  relatedLabel: string;
}) {
  const messages = getStaticMessages(locale as Locale) as Messages;
  // Other published articles in this category.
  const allItems = await getAllContent(contentType, locale as Locale);
  const related = allItems
    .filter((item) => item.slug !== currentSlug)
    .slice(0, 4);

  if (related.length === 0) return null;

  return (
    <div className="mt-16 space-y-8">
      <section>
        <p className="text-xs font-bold uppercase text-primary">
          {messages.shared.morePages}
        </p>
        <h3 className="font-editorial mt-2 text-3xl font-semibold text-foreground">
          {relatedLabel}
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {messages.shared.morePagesDescription}
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {related.map((item) => (
            <SmallCard
              key={item.slug}
              icon={<Swords className="h-5 w-5" />}
              title={item.metadata.title}
              description={item.metadata.description}
              href={localizeHref(`/${contentType}/${item.slug}`, locale)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function SmallCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="signal-card group relative block min-h-44 overflow-hidden border border-border p-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className="absolute right-0 top-0 h-1 w-14 bg-primary/50 transition-all group-hover:w-full" aria-hidden="true" />
      {icon && <div className="mb-5 grid h-10 w-10 place-items-center border border-primary/35 bg-primary/10 text-primary">{icon}</div>}
      <h4 className="font-display text-xl font-semibold text-foreground">
        {title}
      </h4>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </Link>
  );
}
