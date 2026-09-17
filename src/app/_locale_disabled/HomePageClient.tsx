import Link from "next/link";
import { PageDirectory } from "@/components/page-directory";
import { ArrowRight, CircleHelp } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { localizeHref } from "@/components/site";
import { GAME_SITE_CONFIG } from "@/config/game-site";
import type { ContentItem } from "@/lib/content";
import en from "@/locales/en.json";
import { AdSlot, NativeContentAd } from "@/components/adsterra-ads";

type Home = typeof en.home;

const implementedFeatures = [
  "homepage primaryAction internal-link",
  "Codes page table with checked date, source links, redeem steps and not-working checklist",
  "Step-by-step guide page with task cards and links to fruit/build/currency/boss pages",
  "Reference tables with fields gated by evidence status and links to deeper guide pages",
] as const;

export default function HomePageClient({ home, locale, articles }: { home: Home; locale: string; articles: ContentItem[]; recentArticles: ContentItem[] }) {
  const media = GAME_SITE_CONFIG.media;
  const primaryHref = localizeHref(home.hero.primaryHref, locale);
  return <div className="min-w-0 space-y-16 lg:space-y-24">
    <section data-primary-task={home.hero.primaryCta} className="hero-dossier relative isolate overflow-hidden rounded-2xl border border-border bg-card">
      {media.hero && <img src={media.hero} alt={GAME_SITE_CONFIG.brand.name} className="max-h-[32rem] w-full object-contain" />}
      <div className="relative p-6 sm:p-10 lg:p-14">
        <h1 className="font-display max-w-4xl break-words text-4xl font-semibold leading-tight text-foreground sm:text-6xl lg:text-7xl">{home.hero.title}</h1>
        <p data-quick-answer className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{home.hero.description}</p>
        <Button asChild size="lg" className="magnetic-action mt-8 h-auto min-h-12 max-w-full whitespace-normal rounded-full px-6 py-3"><Link href={primaryHref}>{home.hero.primaryCta}<ArrowRight className="ml-3 h-4 w-4 shrink-0" /></Link></Button>
      </div>
    </section>

    {articles.length > 0 && <PageDirectory articles={articles} locale={locale} labels={home.explore} />}

    <div data-ad-placement="home-native"><NativeContentAd /></div>

    <section aria-labelledby="implemented-features-title" className="grid gap-4 sm:grid-cols-3" data-primary-action-type="internal-link">
      <h2 id="implemented-features-title" className="sr-only">Fruit Zombie Survival feature routes</h2>
      {implementedFeatures.slice(1).map((feature, index) => {
        const hrefs = ["/codes/", "/start-here/", "/fruits/"];
        const titles = ["Codes Status", "First Run Route", "Progression Tables"];
        return (
          <Link key={feature} href={localizeHref(hrefs[index], locale)} className="archive-panel block border border-border bg-card/70 p-5 transition hover:border-primary/60 hover:bg-primary/5" data-implementation-component={feature}>
            <span className="font-utility text-xs uppercase text-primary">{titles[index]}</span>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature}</p>
          </Link>
        );
      })}
    </section>

    {home.aboutGame.paragraphs.length > 0 && <section className="archive-panel border border-border bg-card/70 p-6 sm:p-10"><h2 className="font-editorial text-3xl font-semibold">{home.aboutGame.title}</h2>{home.aboutGame.paragraphs.map((text: string, index: number) => <p key={index} className="mt-4 max-w-3xl leading-8 text-muted-foreground">{text}</p>)}</section>}

    {media.trailerVideoId && <section><iframe title={home.aboutGame.title} src={`https://www.youtube-nocookie.com/embed/${media.trailerVideoId}`} loading="lazy" allowFullScreen className="aspect-video w-full rounded-2xl border border-border" /></section>}

    {home.faq.enabled && home.faq.items.length > 0 && <section aria-labelledby="faq-title" className="max-w-4xl"><h2 id="faq-title" className="font-editorial flex items-center gap-3 text-3xl font-semibold"><CircleHelp aria-hidden="true" className="h-7 w-7 text-primary" />{home.faq.title}</h2><Accordion type="single" collapsible className="mt-6 border-t border-border">{home.faq.items.map((item: {question: string; answer: string}, index: number) => <AccordionItem key={index} value={`faq-${index}`}><AccordionTrigger className="text-left">{item.question}</AccordionTrigger><AccordionContent className="leading-7">{item.answer}</AccordionContent></AccordionItem>)}</Accordion></section>}
    <AdSlot name="banner-728x90" className="mx-auto my-12 hidden md:flex" />
    <AdSlot name="banner-320x50" className="mx-auto my-12 md:hidden" />

    <section className="rounded-2xl border border-border bg-primary/5 p-6 sm:p-10"><h2 className="font-editorial text-3xl font-semibold">{home.finalCta.title}</h2><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">{home.finalCta.description}</p><Button asChild className="mt-6 h-auto min-h-11 whitespace-normal rounded-full px-6 py-3"><Link href={localizeHref(home.finalCta.primaryHref, locale)}>{home.finalCta.primary}<ArrowRight className="ml-3 h-4 w-4 shrink-0" /></Link></Button></section>
  </div>;
}
