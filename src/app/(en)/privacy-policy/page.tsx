import type { Metadata } from "next";
import { SITE_URL } from "@/config/game-site";
import { RootEnglishShell } from "@/components/root-english-shell";
import LocalePrivacyPolicyPage from "../../_locale_disabled/privacy-policy/page";

export const metadata: Metadata = { metadataBase: new URL(SITE_URL), title: "Privacy Policy", alternates: { canonical: "/privacy-policy/" } };

export default function PrivacyPolicyPage() {
  return <RootEnglishShell><LocalePrivacyPolicyPage /></RootEnglishShell>;
}
