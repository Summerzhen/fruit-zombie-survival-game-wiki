import Link from "next/link";
import { ChevronRight, ExternalLink, Menu } from "lucide-react";
import { NAVIGATION_CONFIG } from "@/config/navigation";
import { getStaticNamespace } from "@/lib/messages";
import type { NavGroup } from "@/lib/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CollapsibleNavGroup } from "@/components/collapsible-nav-group";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ClientThemeToggle } from "@/components/theme-toggle";
import { SiteSearch, type SearchItem } from "@/components/site-search";
import { CATEGORY_ICONS } from "@/config/content-icons";
import { GAME_SITE_CONFIG } from "@/config/game-site";

export function localizeHref(href: string, locale: string) {
  if (locale === "en" || !href.startsWith("/") || href.startsWith("//") || href === `/${locale}` || href.startsWith(`/${locale}/`)) return href;
  return `/${locale}${href === "/" ? "" : href}`;
}

export async function SiteHeader({ locale, searchItems }: { locale: string; searchItems: SearchItem[] }) {
  const nav = getStaticNamespace(locale, "nav") as Record<string, string>;
  const site = getStaticNamespace(locale, "site") as Record<string, string>;
  const footer = getStaticNamespace(locale, "footer") as Record<string, string>;
  const t = (key: string) => nav[key] ?? key;
  const links = NAVIGATION_CONFIG.map(item => <Link key={item.key} href={localizeHref(item.path, locale)} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-muted">{t(item.key)}</Link>);
  return <><header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl"><div className="mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-8">
    <div className="flex min-h-16 min-w-0 flex-wrap items-center justify-between gap-3 py-3 sm:flex-nowrap">
      <Link href={localizeHref("/", locale)} className="flex min-w-0 items-center gap-3"><img src={GAME_SITE_CONFIG.media.icon} alt="" className="h-10 w-10 shrink-0 object-contain" /><span className="font-display min-w-0 break-words text-lg font-bold sm:text-2xl">{site.name}</span></Link>
      <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto"><SiteSearch items={searchItems} locale={locale} /><LanguageSwitcher locale={locale} /><ThemeToggle label={t("toggleTheme")} />
      <Sheet><SheetTrigger asChild><Button variant="ghost" size="icon" aria-label={t("menu")} className="xl:hidden"><Menu /></Button></SheetTrigger><SheetContent className="overflow-y-auto"><nav aria-label={t("primaryNavigation")} className="mt-8 flex flex-col">{links}</nav></SheetContent></Sheet>
      </div>
    </div>
    <div className="hidden items-center justify-between gap-4 pb-3 xl:flex"><nav aria-label={t("primaryNavigation")} className="flex min-w-0 flex-wrap">{links}</nav>{GAME_SITE_CONFIG.platform.playUrl && <Button asChild className="shrink-0 rounded-full"><Link href={GAME_SITE_CONFIG.platform.playUrl}>{footer.playGame}<ExternalLink className="ml-2 h-4 w-4" /></Link></Button>}</div>
  </div></header></>;
}

function ThemeToggle({ label }: { label: string }) {
  return <ClientThemeToggle label={label} />;
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return <nav className="mb-7 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{items.map((item, index) => <span key={`${item.label}-${index}`} className="flex items-center gap-2">{index > 0 && <ChevronRight className="h-4 w-4" />}{item.href ? <Link className="hover:text-foreground" href={item.href}>{item.label}</Link> : <span className="text-foreground">{item.label}</span>}</span>)}</nav>;
}

export async function WikiSidebar({ locale, navGroups, currentPath }: { locale: string; navGroups: NavGroup[]; currentPath?: string }) {
  const shared = getStaticNamespace(locale, "shared") as Record<string, string>;
  const t = (key: string) => shared[key] ?? key;
  const isActive = (href: string) => currentPath === href;
  return (
    <aside className="hidden min-w-0 space-y-4 xl:sticky xl:top-28 xl:block xl:self-start">
      
      <section className="sidebar-index min-w-0 rounded-2xl bg-card/58 p-3">
        <div className="px-1 pb-3 pt-1">
          <p className="font-utility text-[10px] font-semibold uppercase text-primary/85">{t("archiveIndex")}</p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <h3 className="font-editorial text-xl font-semibold text-foreground">{t("wikiNavigation")}</h3>
            <span className="font-utility text-[10px] text-muted-foreground">{navGroups.reduce((total, group) => total + group.count, 0)} {t("pageCountLabel")}</span>
          </div>
        </div>
        <div className="min-w-0 border-t border-border/55 pt-2">
          {navGroups.map((group) => {
            const GroupIcon = CATEGORY_ICONS[group.slug];
            return (
            <CollapsibleNavGroup key={group.slug} title={group.title} icon={GroupIcon ? <GroupIcon className="h-[18px] w-[18px]" strokeWidth={1.8} /> : <span className="font-utility text-[10px] font-bold">{group.title[0]}</span>} count={group.count} currentPath={currentPath} defaultOpen={currentPath === `/${group.slug}` || currentPath === `/${locale}/${group.slug}` ? false : undefined}>
              <ul className="ml-4 min-w-0 border-l border-border/80 py-1 pl-2">
                {group.links.map((link) => (
                  <li key={link.href} className="min-w-0">
                    <Link href={localizeHref(link.href, locale)} className={`flex min-w-0 items-center gap-2 rounded-r-md border-l-2 px-3 py-1.5 text-xs leading-5 transition-colors ${isActive(link.href) ? "-ml-[9px] border-primary bg-primary/10 font-semibold text-primary" : "border-transparent text-muted-foreground hover:bg-muted/45 hover:text-foreground"}`}>
                      <span className="min-w-0 flex-1 truncate">{link.label}</span>
                      {link.badge && <Badge variant="secondary" className="ml-auto h-5 shrink-0 rounded-sm border-border px-1.5 text-[11px]">{link.badge}</Badge>}
                    </Link>
                  </li>
                ))}
              </ul>
            </CollapsibleNavGroup>
            );
          })}
        </div>
      </section>
      {GAME_SITE_CONFIG.liveModule.enabled && <section className="min-w-0 rounded-2xl bg-card/46 p-3 ring-1 ring-inset ring-border/55">
        <div className="flex items-center justify-between gap-3 px-2 pb-2">
          <h3 className="font-editorial text-lg font-semibold text-foreground">{t("codeEvidenceLabel")}</h3>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--status-success)/.1)] px-2 py-1 text-[10px] font-semibold text-[hsl(var(--status-success))]"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--status-success))]" />Live</span>
        </div>
        <div className="divide-y divide-border/60 border-y border-border/60">
          {GAME_SITE_CONFIG.liveModule.items.map((item) => <div key={item.code} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-2 py-2.5">
            <div className="min-w-0"><code className="font-utility text-[11px] font-semibold text-foreground">{item.code}</code><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.description}</p></div>
            {item.sourceUrl && <a href={item.sourceUrl} className="self-center text-[10px] font-medium text-primary underline">{t("codeEvidenceLabel")} <time>{item.checkedAt}</time></a>}
          </div>)}
        </div>
        <Link href={localizeHref(GAME_SITE_CONFIG.paths.codes, locale)} className="magnetic-action mt-2 flex items-center justify-between rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted/45 hover:text-primary">{t("viewAllCodes")} <ChevronRight className="h-3.5 w-3.5" /></Link>
      </section>}
    </aside>
  );
}

export async function SiteFooter({ locale }: { locale: string }) {
  const footer = getStaticNamespace(locale, "footer") as Record<string, string>;
  const site = getStaticNamespace(locale, "site") as Record<string, string>;
  const nav = getStaticNamespace(locale, "nav") as Record<string, string>;
  const externalLinks = GAME_SITE_CONFIG.externalLinks.map(link => [footer[link.labelKey], link.href]);
  if (GAME_SITE_CONFIG.platform.playUrl) externalLinks.unshift([footer.playGame, GAME_SITE_CONFIG.platform.playUrl]);
  const guideLinks = NAVIGATION_CONFIG.map(item => [nav[item.key], localizeHref(item.path, locale)]);
  const sourceLinks = [
    ["Roblox game page", "https://www.roblox.com/games/75290583112878/Fruit-Zombie-Survival"],
    ["Roblox games API", "https://games.roblox.com/v1/games?universeIds=10654199482"],
    ["Destructoid codes", "https://www.destructoid.com/fruit-zombie-survival-codes/"],
    ["Pro Game Guides codes", "https://progameguides.com/roblox/fruit-zombie-survival-codes/"],
    ["YouTube guide result", "https://www.youtube.com/watch?v=46z26vvlO9E"],
    ["YouTube beginner guide", "https://www.youtube.com/watch?v=ot6bJimnVSE"],
  ];
  return <footer className="relative mt-20 border-t border-border bg-card/45"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="archive-panel mb-8 border border-border bg-card/70 p-6 sm:p-8"><div className="font-display text-3xl font-bold">{site.name}</div><p className="mt-3 max-w-2xl leading-7 text-muted-foreground">{footer.description}</p></div><p className="mb-8 text-xs text-muted-foreground">{site.legalNotice}</p><div className="grid gap-8 border-y border-border py-8 md:grid-cols-4"><div><h3 className="font-editorial text-2xl font-semibold">{footer.aboutTitle}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{footer.about}</p></div>{externalLinks.length > 0 && <FooterList title={footer.quickLinks} links={externalLinks} />}{guideLinks.length > 0 && <FooterList title={footer.guides} links={guideLinks} />}<ExternalFooterList title="Sources" links={sourceLinks} /></div><p className="mt-8 text-xs text-muted-foreground">{footer.copyright}</p></div></footer>;
}

function FooterList({ title, links }: { title: string; links: string[][] }) { return <div><h4 className="font-semibold text-foreground">{title}</h4><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{links.map(([label, href]) => <li key={href}><Link className="hover:text-foreground" href={href}>{label}</Link></li>)}</ul></div>; }

function ExternalFooterList({ title, links }: { title: string; links: string[][] }) { return <div><h4 className="font-semibold text-foreground">{title}</h4><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{links.map(([label, href]) => <li key={href}><a className="hover:text-foreground" href={href}>{label}</a></li>)}</ul></div>; }

export function JsonLd({ data }: { data: unknown }) { return <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />; }
