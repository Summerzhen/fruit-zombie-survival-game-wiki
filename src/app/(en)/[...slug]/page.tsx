import type { Metadata } from "next";
import { CONTENT_TYPES } from "@/config/navigation";
import { getAllContentPaths } from "@/lib/content";
import LocaleSlugPage, { generateMetadata as generateLocaleMetadata } from "../../_locale_disabled/[...slug]/page";
import { RootEnglishShell } from "@/components/root-english-shell";
import { SITE_URL } from "@/config/game-site";
export const dynamicParams = false;

export async function generateStaticParams() {
  const paths = await getAllContentPaths("en");
  const listingPages = CONTENT_TYPES.map((ct) => ({ slug: [ct] }));
  return [
    ...listingPages,
    ...paths.map((item) => ({ slug: [item.contentType, ...item.slug] })),
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const metadata = await generateLocaleMetadata({ params: Promise.resolve({ locale: "en", slug }) });
  return { ...metadata, metadataBase: new URL(SITE_URL) };
}

export default async function RootEnglishSlugPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return (
    <RootEnglishShell>
      <LocaleSlugPage params={Promise.resolve({ locale: "en", slug })} />
    </RootEnglishShell>
  );
}
