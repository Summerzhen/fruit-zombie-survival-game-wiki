export type LiveModuleItem = {
  code: string;
  description: string;
  status?: string;
};

export type ExternalLink = {
  labelKey: string;
  href: string;
};

export type ContentModuleIcon = "book" | "code" | "flame" | "map" | "swords" | "trophy" | "users";

export type ContentModule = {
  key: string;
  slug: string;
  icon: ContentModuleIcon;
  navigationGroup: "primary" | "secondary";
  enabled: boolean;
};

const __SITE_LAUNCH_BASE_CONFIG = {
  brand: {
    name: "Fruit Zombie Survival",
    mobileName: "Fruit Zombie",
    wikiName: "Fruit Zombie Survival",
    tagline: "Independent field guide",
    archiveId: "FZS-001",
  },
  platform: {
    name: "Roblox",
    playUrl: "https://www.roblox.com/games/75290583112878/Fruit-Zombie-Survival",
  },
  media: {
    icon: "/android-chrome-192x192.png",
    logo: "/android-chrome-512x512.png",
    hero: "/android-chrome-512x512.png",
    socialImage: "/android-chrome-512x512.png",
    trailerVideoId: "",
  },
  paths: {
    beginner: "/start-here/",
    guides: "/start-here/",
    codes: "/codes",
    featuredCodes: "/codes/",
    primaryCategory: "/fruits/",
    bosses: "/bosses",
    builds: "/builds/",
  },
  contentModules: [
    { key: "fruits", slug: "fruits", icon: "users", navigationGroup: "primary", enabled: true },
    { key: "bosses", slug: "bosses", icon: "swords", navigationGroup: "primary", enabled: true },
    { key: "guides", slug: "guide", icon: "book", navigationGroup: "primary", enabled: true },
    { key: "codes", slug: "codes", icon: "code", navigationGroup: "primary", enabled: true },
    { key: "builds", slug: "builds", icon: "trophy", navigationGroup: "secondary", enabled: true },
    { key: "maps", slug: "maps", icon: "map", navigationGroup: "secondary", enabled: true },
    { key: "skills", slug: "skills", icon: "flame", navigationGroup: "secondary", enabled: true },
  ] satisfies ContentModule[],
  externalLinks: [
    { labelKey: "officialDiscord", href: "" },
    { labelKey: "officialYoutube", href: "" },
    { labelKey: "vvBuilder", href: "" },
  ] satisfies ExternalLink[],
  liveModule: {
    enabled: true,
    type: "codes",
    items: [
      { code: "", description: "", status: "Active" },
      { code: "", description: "", status: "Active" },
    ] satisfies LiveModuleItem[],
  },
} as const;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fruit-zombie-survival-game.wiki";
if (!SITE_URL) throw new Error("Set research.topic.domain or NEXT_PUBLIC_SITE_URL before building");
if (SITE_URL.replace(/\/$/, "") !== "https://fruit-zombie-survival-game.wiki") throw new Error("NEXT_PUBLIC_SITE_URL conflicts with research.topic.domain"); // site-launch:origin-check

export function absoluteAsset(path: string) {
  return new URL(path, SITE_URL).toString();
}

// site-launch:module-visibility:start
// Only real content categories may appear; inherited code samples are never published.
export const GAME_SITE_CONFIG = {
  ...__SITE_LAUNCH_BASE_CONFIG,
  brand: {"name": "Fruit Zombie Survival", "mobileName": "Fruit Zombie Survival", "wikiName": "Fruit Zombie Survival", "tagline": "", "archiveId": ""},
  platform: {"name": "Roblox", "playUrl": "https://www.roblox.com/games/75290583112878/Fruit-Zombie-Survival"},
  media: {"icon": "/android-chrome-192x192.png", "logo": "/android-chrome-512x512.png", "hero": "", "socialImage": "/android-chrome-512x512.png", "trailerVideoId": ""},
  paths: {"guides": "", "codes": "/codes/", "featuredCodes": "", "primaryCategory": "", "bosses": "/bosses/", "builds": "/builds/", "beginner": "/start-here/"},
  externalLinks: [] as Array<{labelKey: string; href: string}>,
  contentModules: [{"key": "start-here", "slug": "start-here", "icon": "book", "navigationGroup": "primary", "enabled": true}, {"key": "bosses", "slug": "bosses", "icon": "book", "navigationGroup": "primary", "enabled": true}, {"key": "builds", "slug": "builds", "icon": "book", "navigationGroup": "primary", "enabled": true}, {"key": "codes", "slug": "codes", "icon": "book", "navigationGroup": "primary", "enabled": true}, {"key": "diamonds-and-berries", "slug": "diamonds-and-berries", "icon": "book", "navigationGroup": "primary", "enabled": true}, {"key": "fruits", "slug": "fruits", "icon": "book", "navigationGroup": "primary", "enabled": true}, {"key": "updates", "slug": "updates", "icon": "book", "navigationGroup": "primary", "enabled": true}] as Array<{key: string; slug: string; icon: "book"; navigationGroup: "primary"; enabled: boolean}>,
  liveModule: {
    ...__SITE_LAUNCH_BASE_CONFIG.liveModule,
    enabled: false,
    items: [] as Array<{code: string; description: string; status?: string; checkedAt?: string; sourceUrl?: string}>,
  },
} as const;
// site-launch:module-visibility:end
