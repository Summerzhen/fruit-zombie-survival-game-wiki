"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown, Crosshair, X } from "lucide-react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

/**
 * 移动端：标题和正文之间显示可折叠 TOC 面板
 * 桌面端：隐藏（侧边栏有单独的 heading 链接）
 */
export function MobileTOC({ headings, label }: { headings: Heading[]; label: string }) {
  const [open, setOpen] = useState(true);
  const contentId = useId();

  if (headings.length === 0) return null;

  return (
    <div className="archive-panel mb-6 border border-border/75 p-4 xl:hidden">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={contentId}
          className="flex items-center gap-2 rounded-md text-sm font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          {label}
        </button>
        {open && (
          <button type="button" onClick={() => setOpen(false)} className="rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label="Close TOC" aria-controls={contentId}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && (
        <nav id={contentId} aria-label={label} className="mt-3 space-y-1 border-t border-border pt-3">
          {headings.map((h) => (
            <a
              key={h.id}
              href={`#${h.id}`}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                h.level === 3 ? "pl-6" : ""
              }`}
            >
              {h.text}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}

/**
 * 桌面端侧边栏中的 TOC（可折叠）
 * 移动端隐藏
 */
export function SidebarTOC({ headings, label, currentPathname }: { headings: Heading[]; label: string; currentPathname: string }) {
  const [open, setOpen] = useState(true);
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");
  const contentId = useId();

  useEffect(() => {
    const sections = headings.map((heading) => document.getElementById(heading.id)).filter(Boolean) as HTMLElement[];
    if (sections.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]?.target.id) setActiveId(visible[0].target.id);
    }, { rootMargin: "-18% 0px -68% 0px" });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [headings, currentPathname]);

  if (headings.length === 0) return null;

  return (
    <div className="premium-shell relative hidden overflow-hidden p-1.5 xl:block">
      <div className="premium-core overflow-hidden">
      <span className="absolute left-6 top-0 h-px w-16 bg-primary" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center justify-between border-b border-border/70 bg-muted/18 px-5 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span className="flex items-center gap-2"><Crosshair className="h-4 w-4 text-primary" /><h3 className="font-utility text-[11px] font-bold uppercase text-foreground">{label}</h3></span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul id={contentId} className="space-y-1 p-3">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                onClick={() => setActiveId(h.id)}
                className={`relative block rounded-r-lg border-l-2 px-3 py-2 text-xs leading-5 transition ${h.level === 3 ? "pl-6" : ""} ${activeId === h.id ? "border-primary bg-primary/14 font-semibold text-primary" : "border-border/70 text-muted-foreground hover:border-primary/40 hover:bg-muted/45 hover:text-foreground"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring`}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      )}
      </div>
    </div>
  );
}
