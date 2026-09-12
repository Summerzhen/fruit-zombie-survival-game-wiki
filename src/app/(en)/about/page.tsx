import type { Metadata } from "next";
import { SITE_URL } from "@/config/game-site";
import { RootEnglishShell } from "@/components/root-english-shell";
import LocaleAboutPage from "../../_locale_disabled/about/page";

export const metadata: Metadata = { metadataBase: new URL(SITE_URL), title: "About", alternates: { canonical: "/about/" } };

export default function AboutPage() {
  return <RootEnglishShell><LocaleAboutPage /></RootEnglishShell>;
}
