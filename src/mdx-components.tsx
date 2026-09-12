import Link from "next/link";
import type { MDXComponents } from "mdx/types";
import { Children, isValidElement } from "react";

function toHeadingId(children: React.ReactNode): string {
  const textOf = (value: React.ReactNode): string => Children.toArray(value).map(child => {
    if (typeof child === "string" || typeof child === "number") return String(child);
    return isValidElement<{children?: React.ReactNode}>(child) ? textOf(child.props.children) : "";
  }).join("");
  const text = textOf(children).trim();
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...defaultComponents,
    ...components,
  };
}

const defaultComponents: MDXComponents = {
  h1: ({ children, id }) => <h2 id={id || toHeadingId(children)} className="font-display mt-12 scroll-m-24 border-b border-border pb-3 text-3xl font-semibold text-foreground">{children}</h2>,
  h2: ({ children, id }) => {
    const headingId = id || toHeadingId(children);
    return (
      <h2 id={headingId} className="font-display mt-12 scroll-m-24 border-b border-border pb-3 text-3xl font-semibold tracking-tight text-foreground first:mt-0">
        {children}
      </h2>
    );
  },
  h3: ({ children, id }) => {
    const headingId = id || toHeadingId(children);
    return <h3 id={headingId} className="font-display mt-9 text-2xl font-semibold text-foreground">{children}</h3>;
  },
  p: ({ children }) => <p className="my-5 leading-8 text-muted-foreground">{children}</p>,
  ul: ({ children }) => <ul className="my-5 ml-5 list-disc space-y-2 text-muted-foreground marker:text-[hsl(var(--nav-theme))]">{children}</ul>,
  li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  a: ({ href = "", children }) => (
    <Link className="font-medium text-[hsl(var(--nav-theme))] underline-offset-4 hover:underline" href={href}>
      {children}
    </Link>
  ),
  table: ({ children }) => (
    <div className="game-card my-8 overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[640px] text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/70 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">{children}</thead>,
  th: ({ children }) => <th className="px-4 py-3 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-t border-border px-4 py-3 text-muted-foreground">{children}</td>,
  blockquote: ({ children }) => (
    <blockquote className="my-8 rounded-lg border-l-4 border-[hsl(var(--nav-theme-light))] bg-[hsl(var(--nav-theme))]/10 p-5 text-sm text-foreground">
      {children}
    </blockquote>
  ),
};
