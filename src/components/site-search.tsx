"use client";

import Link from "next/link";
import { getStaticNamespace } from "@/lib/messages";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Command, FileText, Search, X } from "lucide-react";

export interface SearchItem {
  title: string;
  description: string;
  contentType: string;
  href: string;
}


export function SiteSearch({ items, locale, compact = false }: { items: SearchItem[]; locale: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const copy = getStaticNamespace(locale, "search") as Record<string, string>;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.matches("input, textarea, select, [contenteditable='true']");
      if ((event.key === "/" && !typing) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
    };
  }, [open]);

  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return items.slice(0, 7);
    return items
      .map((item) => {
        const title = item.title.toLocaleLowerCase();
        const description = item.description.toLocaleLowerCase();
        const type = item.contentType.toLocaleLowerCase();
        const score = title === needle ? 5 : title.startsWith(needle) ? 4 : title.includes(needle) ? 3 : type.includes(needle) ? 2 : description.includes(needle) ? 1 : 0;
        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ item }) => item);
  }, [items, query]);

  function closeSearch() {
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={compact
          ? "grid h-9 w-9 place-items-center border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-foreground"
          : "group flex h-10 min-w-48 items-center gap-2 border border-border bg-card/80 px-3 text-sm text-muted-foreground shadow-sm transition hover:border-primary hover:text-foreground"}
        aria-label={copy.button}
      >
        <Search className="h-4 w-4" />
        {!compact && <><span className="flex-1 text-left">{copy.button}</span><kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold">⌘K</kbd></>}
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4 sm:pt-[7vh]" role="dialog" aria-modal="true" aria-label={copy.button} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div className="archive-panel flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden border border-border bg-popover shadow-2xl sm:max-h-[min(720px,86dvh)]">
            <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card/50 px-4 transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary/20">
              <Search className="h-5 w-5 shrink-0 text-primary" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && results[0]) {
                    event.preventDefault();
                    const href = results[0].href;
                    closeSearch();
                    window.location.assign(href);
                  }
                }}
                placeholder={copy.placeholder}
                className="site-search-input h-14 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" aria-label={copy.close}><X className="h-4 w-4" /></button>
            </div>

            <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto p-2 sm:p-3">
              <div className="mb-1.5 flex items-center justify-between gap-4 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="truncate">{query ? copy.results : copy.hint}</span>
                <span>{results.length}</span>
              </div>
              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((item) => (
                    <Link key={item.href} href={item.href} onClick={closeSearch} className="group flex items-start gap-3 rounded-md px-3 py-2.5 transition hover:bg-muted focus-visible:bg-muted">
                      <span className="game-icon game-icon-sm mt-0.5 border-primary/20 bg-primary/10 text-primary"><FileText /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2"><span className="truncate font-semibold text-foreground">{item.title}</span><ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:opacity-100" /></span>
                        <span className="mt-1 line-clamp-1 text-sm text-muted-foreground">{item.description}</span>
                      </span>
                      <span className="mt-1 hidden shrink-0 rounded-md border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground sm:inline-flex">{item.contentType.replace(/-/g, " ")}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid min-h-32 place-items-center text-sm text-muted-foreground">{copy.empty}</div>
              )}
            </div>
            <div className="hidden shrink-0 items-center gap-2 border-t border-border bg-muted/40 px-4 py-2.5 text-[11px] text-muted-foreground sm:flex"><Command className="h-3.5 w-3.5" /> <span>Enter to open · Esc to close · / to search</span></div>
          </div>
        </div>
      )}
    </>
  );
}
