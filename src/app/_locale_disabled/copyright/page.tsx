import { prefixedLocales } from "@/i18n/routing";
import { LegalPage } from "@/components/legal-page";
import { GAME_SITE_CONFIG } from "@/config/game-site";

export const dynamicParams = false;

export function generateStaticParams() {
  return prefixedLocales.map((locale) => ({ locale }));
}


export default function CopyrightPage() {
  return (
    <LegalPage title="Copyright">
      <p>{GAME_SITE_CONFIG.brand.name}, {GAME_SITE_CONFIG.platform.name}, their logos, and related media belong to their respective owners.</p>
      <p>This site is an unofficial fan wiki created for informational and guide purposes.</p>
      <p>If you own rights to content displayed here and have a concern, please contact the site operator for review.</p>
    </LegalPage>
  );
}
