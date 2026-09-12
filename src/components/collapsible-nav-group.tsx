"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleNavGroupProps {
  title: string;
  icon: React.ReactNode;
  count?: number;
  defaultOpen?: boolean;
  currentPath?: string;
  children: React.ReactNode;
}

export function CollapsibleNavGroup({ title, icon, count, defaultOpen, currentPath, children }: CollapsibleNavGroupProps) {
  const containsCurrent = currentPath ? hasMatchingLink(children, currentPath) : false;
  const shouldOpen = defaultOpen ?? containsCurrent;
  const [open, setOpen] = useState(shouldOpen);
  const contentId = useId();

  return (
    <div className={`group/nav overflow-hidden border-b border-border/45 transition-colors last:border-b-0 ${open ? "bg-muted/24" : "hover:bg-muted/18"}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex min-h-12 w-full min-w-0 items-center gap-2.5 px-1 text-left text-[13px] font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors ${open ? "bg-primary/12 text-primary" : "text-muted-foreground group-hover/nav:bg-muted/45 group-hover/nav:text-primary"}`}>{icon}</span>
        <span className="min-w-0 flex-1 truncate leading-5">{title}</span>
        {count !== undefined && <span className={`font-utility shrink-0 text-[10px] font-medium tabular-nums ${open ? "text-primary" : "text-muted-foreground"}`}>{String(count).padStart(2, "0")}</span>}
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180 text-primary" : ""}`} />
      </button>
      <div id={contentId} hidden={!open} className="min-w-0 px-3 pb-2">
        {children}
      </div>
    </div>
  );
}

/** Check if any <Link href="..."> inside children matches currentPath */
function hasMatchingLink(children: React.ReactNode, currentPath: string): boolean {
  if (!children) return false;
  if (Array.isArray(children)) return children.some((c) => hasMatchingLink(c, currentPath));
  if (typeof children === "object" && children !== null && "props" in children) {
    const props = (children as React.ReactElement).props;
    const href = props.href as string | undefined;
    if (href && (href === currentPath || currentPath.startsWith(href + "/"))) return true;
    if (props.children) return hasMatchingLink(props.children, currentPath);
  }
  return false;
}
