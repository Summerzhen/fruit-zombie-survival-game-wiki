"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ContentItem } from "@/lib/content";

export function PageDirectory({ articles, locale, labels }: { articles: ContentItem[]; locale: string; labels: {title: string; description: string; searchLabel: string; allLabel: string; noResultsLabel: string} }) {
  const [query, setQuery] = useState('');
  const visible = articles.filter(article => `${article.metadata.title} ${article.metadata.description}`.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale)));
  return <section aria-labelledby="directory-title">
    <div className="border-l-2 border-primary pl-5"><h2 id="directory-title" className="font-editorial text-3xl font-semibold">{labels.title}</h2><p className="mt-3 max-w-2xl leading-7 text-muted-foreground">{labels.description}</p></div>
    <label className="mt-6 block max-w-xl text-sm font-medium">{labels.searchLabel}<input type="search" value={query} onChange={event => setQuery(event.target.value)} className="mt-2 block w-full rounded-lg border border-border bg-background px-4 py-3 text-base outline-offset-2 focus:outline focus:outline-2 focus:outline-primary" /></label>
    <div className="mt-8 border-y border-border">
      {visible.map((article, index) => <Link key={`${article.contentType}/${article.slug}`} href={`${locale === 'en' ? '' : '/' + locale}/${article.contentType}/${article.slug}`} className={`objective-row group grid min-w-0 grid-cols-[40px_minmax(0,1fr)_24px] items-start gap-4 py-6 transition hover:bg-primary/5 sm:grid-cols-[72px_minmax(0,1fr)_28px] sm:px-4 ${index ? 'border-t border-border' : ''}`}>
        <span aria-hidden="true" className="font-display text-3xl text-primary/50 sm:text-5xl">{String(index + 1).padStart(2, '0')}</span>
        <span className="min-w-0"><span className="font-editorial block break-words text-xl font-semibold group-hover:text-primary sm:text-2xl">{article.metadata.title}</span><span className="mt-2 block text-sm leading-6 text-muted-foreground">{article.metadata.description}</span></span><ArrowRight aria-hidden="true" className="mt-2 h-5 w-5" />
      </Link>)}
      {!visible.length && <p role="status" className="py-8 text-muted-foreground">{labels.noResultsLabel}</p>}
    </div>
  </section>;
}
