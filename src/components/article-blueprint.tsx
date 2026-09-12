import Link from "next/link";
import { ArrowUpRight, BookOpenCheck, FileText, ListChecks } from "lucide-react";
import type { ArticleBlueprint } from "@/config/article-blueprints";
import type { ContentItem } from "@/lib/content";
import type { Locale } from "@/i18n/routing";
import { localizeHref } from "@/components/site";

type ArticleBlueprintProps = {
  blueprint: ArticleBlueprint;
  contentType: string;
  items: ContentItem[];
  locale: Locale;
  readMoreLabel: string;
};

export function ArticleBlueprintView({
  blueprint,
  contentType,
  items,
  locale,
  readMoreLabel,
}: ArticleBlueprintProps) {
  const labels = {
    example: "Guide example",
    fields: "Guide details",
    structure: "Page sections",
    structureNote: "Organized around the questions players need answered.",
    library: "Published guides",
    libraryNote: "Open a real guide for the full game context.",
    entries: "entries",
  };

  const sampleExists = items.some((item) => item.slug === blueprint.sampleSlug);
  const sampleHref = localizeHref(
    `/${contentType}/${blueprint.sampleSlug}`,
    locale,
  );

  return (
    <>
      <section className="hidden" aria-labelledby="blueprint-title">
        <div className="grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="border-b border-border p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
            <p className="text-xs font-bold uppercase text-primary">
              {blueprint.eyebrow}
            </p>
            <h2 id="blueprint-title" className="font-editorial mt-3 max-w-[18ch] text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {blueprint.title}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              {blueprint.description}
            </p>

            <dl className="mt-7 grid grid-cols-1 border-y border-border sm:grid-cols-3">
              {blueprint.facts.map((fact, index) => (
                <div key={fact.label} className={`py-4 sm:px-4 ${index > 0 ? "border-t border-border sm:border-l sm:border-t-0" : ""}`}>
                  <dt className="text-[11px] font-bold uppercase text-muted-foreground">
                    {fact.label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="signal-card mt-8 border border-primary/30 bg-muted/35 px-5 py-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
                <BookOpenCheck className="h-4 w-4" />
                {labels.example}
              </div>
              <h3 className="font-editorial mt-3 text-2xl font-semibold leading-snug text-foreground">
                {sampleExists ? (
                  <Link className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={sampleHref}>
                    {blueprint.sampleTitle}
                  </Link>
                ) : blueprint.sampleTitle}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {blueprint.sampleSummary}
              </p>
              <p className="mt-6 text-[11px] font-bold uppercase text-muted-foreground">
                {labels.fields}
              </p>
              <dl className="mt-3 divide-y divide-border border-y border-border">
                {blueprint.sampleFields.map((field) => (
                  <div key={field.label} className="grid gap-1 py-3 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-4">
                    <dt className="text-xs font-semibold text-muted-foreground">{field.label}</dt>
                    <dd className="text-sm font-medium text-foreground">{field.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-start gap-3">
              <ListChecks className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-display text-2xl font-semibold text-foreground">{labels.structure}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{labels.structureNote}</p>
              </div>
            </div>
            <ol className="mt-6 border-t border-border">
              {blueprint.sections.map((section, index) => (
                <li key={section.title} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 border-b border-border py-5 sm:grid-cols-[2.75rem_minmax(9rem,0.7fr)_minmax(0,1fr)] sm:gap-4">
                  <span className="font-mono text-xs font-bold text-primary" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h4 className="text-sm font-semibold leading-6 text-foreground">{section.title}</h4>
                  <p className="col-start-2 text-sm leading-6 text-muted-foreground sm:col-start-auto">{section.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="article-library-title">
        <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-primary">
              {String(items.length).padStart(2, "0")} {labels.entries}
            </p>
            <h2 id="article-library-title" className="font-editorial mt-2 text-3xl font-semibold text-foreground">
              {labels.library}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{labels.libraryNote}</p>
          </div>
          <FileText className="hidden h-7 w-7 text-muted-foreground sm:block" aria-hidden="true" />
        </div>

        {items.length > 0 ? (
          <div>
            {items.map((item, index) => (
              <Link
                key={`/${contentType}/${item.slug}`}
                href={localizeHref(`/${contentType}/${item.slug}`, locale)}
                className="group grid gap-3 border-b border-l-2 border-l-transparent border-border py-6 transition-colors hover:border-l-primary hover:bg-primary/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[3.25rem_minmax(0,1fr)_auto] sm:items-start sm:px-3"
              >
                <span className="font-mono text-xs font-bold text-muted-foreground group-hover:text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-xl font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                      {item.metadata.title}
                    </span>
                    {item.metadata.badge && (
                      <span className="border border-primary/35 bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase text-primary">
                        {item.metadata.badge}
                      </span>
                    )}
                  </span>
                  <span className="mt-2 block max-w-3xl text-sm leading-6 text-muted-foreground">
                    {item.metadata.description}
                  </span>
                  <span className="mt-3 block text-[11px] font-bold uppercase text-muted-foreground">
                    {item.metadata.lastModified ?? item.metadata.date}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 self-center text-xs font-semibold text-primary sm:pl-4">
                  {readMoreLabel}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
