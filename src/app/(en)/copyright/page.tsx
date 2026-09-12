import type { Metadata } from "next";
import { SITE_URL } from "@/config/game-site";
import { RootEnglishShell } from "@/components/root-english-shell";
import LocaleCopyrightPage from "../../_locale_disabled/copyright/page";

export const metadata: Metadata = { metadataBase: new URL(SITE_URL), title: "Copyright", alternates: { canonical: "/copyright/" } };

export default function CopyrightPage() {
  return <RootEnglishShell><LocaleCopyrightPage /></RootEnglishShell>;
}
