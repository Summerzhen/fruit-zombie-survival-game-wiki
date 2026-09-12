import type { Metadata } from "next";
import { SITE_URL } from "@/config/game-site";
import { RootEnglishShell } from "@/components/root-english-shell";
import LocaleTermsOfServicePage from "../../_locale_disabled/terms-of-service/page";

export const metadata: Metadata = { metadataBase: new URL(SITE_URL), title: "Terms of Service", alternates: { canonical: "/terms-of-service/" } };

export default function TermsOfServicePage() {
  return <RootEnglishShell><LocaleTermsOfServicePage /></RootEnglishShell>;
}
