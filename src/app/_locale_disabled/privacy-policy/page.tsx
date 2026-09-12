import { prefixedLocales } from "@/i18n/routing";
import { LegalPage } from "@/components/legal-page";
import { GAME_SITE_CONFIG } from "@/config/game-site";

export const dynamicParams = false;

export function generateStaticParams() {
  return prefixedLocales.map((locale) => ({ locale }));
}


export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>{GAME_SITE_CONFIG.brand.wikiName} provides informational game guides. We do not request game account credentials, platform passwords, or private payment information.</p>
      <p>Basic analytics, advertising, and hosting providers may process standard technical information such as device type, browser, approximate region, and visited pages.</p>
      <p>External links may lead to {GAME_SITE_CONFIG.platform.name}, community platforms, video services, or other tools. Those services are governed by their own privacy policies.</p>
    </LegalPage>
  );
}
