import { prefixedLocales } from "@/i18n/routing";
import { LegalPage } from "@/components/legal-page";
import { GAME_SITE_CONFIG } from "@/config/game-site";

export const dynamicParams = false;

export function generateStaticParams() {
  return prefixedLocales.map((locale) => ({ locale }));
}


export default function AboutPage() {
  return (
    <LegalPage title="About">
      <p>{GAME_SITE_CONFIG.brand.wikiName} is an independent fan-built guide hub covering progression routes, systems, encounters, builds, and essential game knowledge for new and veteran players alike.</p>
      <p>Our guides are organized around practical player questions and are reviewed as the game evolves.</p>
    </LegalPage>
  );
}
