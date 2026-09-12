"use client";

import { Search } from "lucide-react";

export function WikiSearchTrigger({ label, hint }: { label: string; hint: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "/" }))}
      className="signal-card group border border-[hsl(var(--nav-theme-light)/0.55)] bg-[hsl(var(--nav-theme)/0.07)] p-5 text-left transition hover:bg-[hsl(var(--nav-theme)/0.12)]"
      aria-label={label}
    >
      <span className="grid h-11 w-11 place-items-center border border-primary/30 bg-foreground text-background">
        <Search className="h-5 w-5" />
      </span>
      <span className="mt-5 block font-bold text-foreground">{label}</span>
      <span className="mt-2 block text-sm text-muted-foreground">{hint}</span>
    </button>
  );
}
