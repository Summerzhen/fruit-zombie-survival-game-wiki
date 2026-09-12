import {
  BellRing,
  BookOpen,
  Code2,
  Coins,
  Compass,
  Crosshair,
  Eye,
  Flame,
  FlaskConical,
  Ghost,
  Hammer,
  KeyRound,
  Map as MapIcon,
  MapPin,
  Shield,
  Snowflake,
  Sparkles,
  Swords,
  Timer,
  Trophy,
  Users,
  Crown,
  type LucideIcon,
} from "lucide-react";
import type { ContentItem } from "@/lib/content";
import { NAVIGATION_CONFIG } from "@/config/navigation";

export const CATEGORY_ICONS: Record<string, LucideIcon> = Object.fromEntries(
  NAVIGATION_CONFIG.map((item) => [item.path.replace(/^\//, ""), item.icon]),
);

const CONTENT_ICON_RULES: Array<{ pattern: RegExp; icon: LucideIcon }> = [
  { pattern: /spark|schrift/i, icon: Crosshair },
  { pattern: /shikai[- ]spirit/i, icon: Ghost },
  { pattern: /gelum/i, icon: Snowflake },
  { pattern: /calamitas|cinder/i, icon: Flame },
  { pattern: /lord[- ]nivis|heir[- ]of[- ]the[- ]dead/i, icon: Crown },
  { pattern: /sakkaku/i, icon: Eye },
  { pattern: /storm|soul[- ]reaper/i, icon: Shield },
  { pattern: /code|redeem/i, icon: KeyRound },
  { pattern: /hueco[- ]mundo/i, icon: Compass },
  { pattern: /soul[- ]society|location|map/i, icon: MapPin },
  { pattern: /farm/i, icon: Coins },
  { pattern: /level/i, icon: Timer },
  { pattern: /builder/i, icon: Hammer },
  { pattern: /extract/i, icon: FlaskConical },
  { pattern: /aura/i, icon: Sparkles },
  { pattern: /bell|invasion/i, icon: BellRing },
];

export function getContentIcon(article: Pick<ContentItem, "slug" | "contentType" | "metadata">): LucideIcon {
  const searchableText = `${article.slug} ${article.metadata.title} ${article.metadata.category}`;
  return CONTENT_ICON_RULES.find(({ pattern }) => pattern.test(searchableText))?.icon
    ?? CATEGORY_ICONS[article.contentType]
    ?? BookOpen;
}
