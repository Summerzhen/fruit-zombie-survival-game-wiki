"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, X } from "lucide-react";
import { localizeHref } from "@/components/site";
import { getContentIcon } from "@/config/content-icons";
import { GAME_SITE_CONFIG } from "@/config/game-site";
import type { ContentItem } from "@/lib/content";

const FILTERS = ["all", ...GAME_SITE_CONFIG.contentModules.map((item) => item.slug)] as const;

export function GuideExplorer({ articles, locale }: { articles: ContentItem[]; locale: string }) {
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const labels = Object.fromEntries(GAME_SITE_CONFIG.contentModules.map((item) => [item.slug, item.slug.replace(/-/g, " ").replace(/\w/g, (c) => c.toUpperCase())]));
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return articles
      .filter((article) => filter === "all" || article.contentType === filter)
      .filter((article) => !needle || `${article.metadata.title} ${article.metadata.description}`.toLowerCase().includes(needle))
      .sort((a, b) => (b.metadata.lastModified || b.metadata.date).localeCompare(a.metadata.lastModified || a.metadata.date))
      .slice(0, 8);
  }, [articles, filter, query]);

  return <div className="guide-explorer premium-shell relative overflow-hidden p-1.5"><div className="premium-core overflow-hidden"><div className="border-b border-border/70 bg-muted/15 p-4 sm:p-5"><div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search codes, fruits, builds, wave threats, or updates" aria-label="Search guides" className="h-[3.25rem] w-full rounded-xl border border-input/80 bg-background/72 pl-10 pr-11 text-base text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>}</div><div className="mt-3 flex gap-1.5 overflow-x-auto pb-1" aria-label="Guide categories">{FILTERS.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className={`h-9 shrink-0 rounded-full border px-3.5 text-xs font-semibold transition ${filter === item ? "border-primary bg-primary text-primary-foreground" : "border-border/80 bg-background/55 text-muted-foreground hover:border-primary/60 hover:text-foreground"}`}>{item === "all" ? "All guides" : labels[item]}</button>)}</div></div><div aria-live="polite">{results.length > 0 ? results.map((article, index) => { const Icon = getContentIcon(article); return <Link key={`${article.contentType}/${article.slug}`} href={localizeHref(`/${article.contentType}/${article.slug}`, locale)} className={`group grid grid-cols-[40px_minmax(0,1fr)_28px] items-center gap-3 border-l-2 border-transparent p-4 transition hover:border-primary hover:bg-primary/[0.07] sm:grid-cols-[44px_minmax(0,1fr)_120px_28px] sm:px-5 ${index > 0 ? "border-t border-border/70" : ""}`}><span className="game-icon game-icon-sm"><Icon /></span><span className="min-w-0"><span className="block truncate text-base font-bold text-foreground group-hover:text-primary">{article.metadata.title}</span><span className="mt-1 block truncate text-sm text-muted-foreground">{article.metadata.description}</span></span><span className="font-utility hidden text-right text-[11px] uppercase text-muted-foreground sm:block">{article.metadata.lastModified || article.metadata.date}</span><span className="grid h-8 w-8 place-items-center rounded-full bg-muted/50 text-muted-foreground transition group-hover:bg-primary/12 group-hover:text-primary"><ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span></Link>; }) : <div className="px-5 py-12 text-center"><p className="font-semibold text-foreground">No matching guides</p><p className="mt-1 text-sm text-muted-foreground">Try another keyword or category.</p></div>}</div><div className="flex items-center justify-between border-t border-border/70 bg-muted/25 px-4 py-3 text-xs text-muted-foreground sm:px-5"><span>Showing {results.length} guides</span><span className="font-utility uppercase">Recently updated</span></div></div></div>;
}
