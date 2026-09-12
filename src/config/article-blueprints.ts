export type ArticleBlueprint = {
  eyebrow: string;
  title: string;
  description: string;
  sampleTitle: string;
  sampleSummary: string;
  sampleSlug: string;
  facts: Array<{ label: string; value: string }>;
  sampleFields: Array<{ label: string; value: string }>;
  sections: Array<{ title: string; description: string }>;
};

export const ARTICLE_BLUEPRINTS: Record<string, ArticleBlueprint> = {
  codes: {
    eyebrow: "Reward check",
    title: "Reported codes, redeem steps, and failure checks",
    description: "Keep code strings, rewards, status notes, and update checks in one compact player page.",
    sampleTitle: "Codes and redeem help",
    sampleSummary: "Check reported codes, redeem carefully, and use the failure checklist when Roblox rejects a code.",
    sampleSlug: "index",
    facts: [{ label: "Best for", value: "Returning players" }, { label: "Format", value: "Status table" }, { label: "Next", value: "Updates" }],
    sampleFields: [{ label: "Code", value: "Reported string" }, { label: "Reward", value: "Reported reward" }, { label: "Checked", value: "Review date" }],
    sections: [{ title: "Reported codes", description: "List only sourced rows." }, { title: "Redeem steps", description: "Show the short in-game path." }, { title: "Troubleshooting", description: "Separate expired, reused, and mistyped codes." }],
  },
};

export function getArticleBlueprint(contentType: string): ArticleBlueprint | null {
  return ARTICLE_BLUEPRINTS[contentType] ?? null;
}
