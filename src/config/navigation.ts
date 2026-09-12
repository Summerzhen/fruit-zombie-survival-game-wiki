import { BookOpen, Code2, Flame } from "lucide-react";

export const NAVIGATION_CONFIG = [
  { key: "codes", label: "Codes", path: "/codes/", icon: Code2, isContentType: false, navigationGroup: "primary", external: false },
  { key: "start-here", label: "Start Here", path: "/start-here/", icon: BookOpen, isContentType: false, navigationGroup: "primary", external: false },
  { key: "fruits", label: "Fruits", path: "/fruits/", icon: BookOpen, isContentType: false, navigationGroup: "primary", external: false },
  { key: "builds", label: "Builds", path: "/builds/", icon: Flame, isContentType: false, navigationGroup: "primary", external: false },
  { key: "currencies", label: "Currencies", path: "/diamonds-and-berries/", icon: BookOpen, isContentType: false, navigationGroup: "primary", external: false },
  { key: "bosses", label: "Elite Waves", path: "/bosses/", icon: BookOpen, isContentType: false, navigationGroup: "primary", external: false },
  { key: "updates", label: "Updates", path: "/updates/", icon: BookOpen, isContentType: false, navigationGroup: "primary", external: false },
] as const;

// Keep planned top-level links separate from the real article-directory index.
// Search and wiki navigation consume this same published content-type list.
export const CONTENT_TYPES: string[] = ["start-here", "bosses", "builds", "codes", "diamonds-and-berries", "fruits", "updates"];
