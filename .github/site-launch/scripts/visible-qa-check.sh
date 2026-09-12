#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  visible-qa-check.sh <site-dir> [domain]

Checks after `npm run build` for visible first-screen QA problems that plain HTTP/SEO
checks miss:
  - source language contamination, especially Hangul leaking into non-ko locales/content;
  - root and locale HTML `<html lang>` values in static output;
  - English/zh/ja primary nav must not contain Korean navigation words;
  - first-screen assets referenced by generated HTML must exist in public/ and be non-empty;
  - YouTube remote thumbnails must not be used as hero/video thumbnails;
  - temporary text logo badges such as MO/VV must not remain in the site header;
  - non-English homepage HTML must not keep copied English hero/nav/sidebar/CTA text;
  - site-specific asset provenance, when present, must match the local official assets/game id;
  - homepage navigation must not render empty sidebar menus or omit configured flat launch pages;
  - hero screenshot asset must be real, non-empty, landscape, and rendered in an aspect-safe 16:9 container.

Environment:
  VISIBLE_QA_ALLOW_REMOTE_YOUTUBE_THUMB=1  Allow i.ytimg.com thumbnail references.
  VISIBLE_QA_ALLOW_TEXT_LOGO=1             Allow old text logo badges.
  VISIBLE_QA_FORBIDDEN_TERMS="a,b,c"       Extra comma-separated legacy terms to reject in first-screen HTML/source.
EOF
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

SITE_DIR="${1:-}"
DOMAIN="${2:-}"
[[ -n "$SITE_DIR" ]] || { usage >&2; exit 2; }
SITE_DIR="$(realpath -m "$SITE_DIR")"
[[ -d "$SITE_DIR" ]] || { echo "ERROR: site dir does not exist: $SITE_DIR" >&2; exit 1; }
cd "$SITE_DIR"
[[ -d out ]] || { echo "ERROR: visible QA requires built ./out directory" >&2; exit 1; }
export VISIBLE_QA_DOMAIN="$DOMAIN"

node <<'NODE'
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const errors = [];
const warnings = [];
const allowRemoteYoutubeThumb = process.env.VISIBLE_QA_ALLOW_REMOTE_YOUTUBE_THUMB === '1';
const allowTextLogo = process.env.VISIBLE_QA_ALLOW_TEXT_LOGO === '1';
const forbiddenTerms = (process.env.VISIBLE_QA_FORBIDDEN_TERMS || 'VV: ULTIMATUM,VV Ultimatum,ULTIMATUM,Shinigami,Quincy,Hollow')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const rawDomain = process.env.VISIBLE_QA_DOMAIN || '';
const domain = rawDomain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
const localeFiles = exists('src/locales')
  ? fs.readdirSync('src/locales').filter((name) => name.endsWith('.json')).map((name) => name.replace(/\.json$/, ''))
  : [];

function exists(p) { try { return fs.existsSync(p); } catch { return false; } }
function read(p) { return fs.readFileSync(p, 'utf8'); }
function walk(dir, files = []) {
  if (!exists(dir)) return files;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules','.next','out','.git'].includes(entry.name)) walk(full, files);
    } else files.push(full);
  }
  return files;
}
function rel(p) { return path.relative(process.cwd(), p).replaceAll(path.sep, '/'); }
function normalizeAssetPath(value) {
  if (!value) return '';
  const text = String(value).replaceAll(path.sep, '/').replace(/^\.\//, '');
  return text.startsWith('public/') ? text : text.replace(/^\//, 'public/');
}
function provenanceEntries(provenance) {
  const raw = provenance && provenance.assets;
  if (Array.isArray(raw)) return raw.filter((asset) => asset && typeof asset === 'object');
  if (raw && typeof raw === 'object') return Object.values(raw).filter((asset) => asset && typeof asset === 'object');
  return [];
}
function provenanceByLocalPath(provenance) {
  const entries = new Map();
  for (const asset of provenanceEntries(provenance)) {
    const local = normalizeAssetPath(asset.localPath || asset.file || asset.path);
    if (local) entries.set(local, asset);
  }
  return entries;
}
function sourceUrlMatchesRoblox(sourceUrl) {
  return /^https:\/\/(?:www\.)?roblox\.com\/games\//i.test(sourceUrl)
    || /^https:\/\/tr\.rbxcdn\.com\//i.test(sourceUrl)
    || /^https:\/\/.*\.rbxcdn\.com\//i.test(sourceUrl);
}
function visibleLinkLabels(html) {
  return [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => ({
      href: m[1],
      label: m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    }))
    .filter((item) => item.href && item.label);
}

// 1) Source contamination: Hangul outside Korean source is almost always a copy/paste bug.
const nonKoRoots = ['src/locales/en.json','src/locales/zh.json','src/locales/ja.json','src/locales/de.json','content/en','content/zh','content/ja','content/de'];
for (const root of nonKoRoots) {
  const paths = exists(root) && fs.statSync(root).isDirectory() ? walk(root) : (exists(root) ? [root] : []);
  for (const file of paths.filter(f => /\.(json|mdx?|tsx?)$/.test(f))) {
    const text = read(file);
    if (/[\uAC00-\uD7AF]/.test(text)) errors.push(`Hangul text leaked into non-ko file: ${rel(file)}`);
  }
}

// 1b) Legacy/template source residue. This catches old game copy that may not show in nav.
for (const root of ['src','content','public/manifest.json']) {
  const paths = exists(root) && fs.statSync(root).isDirectory() ? walk(root) : (exists(root) ? [root] : []);
  for (const file of paths.filter(f => /\.(json|mdx?|tsx?|html|svg|txt)$/.test(f))) {
    const text = read(file);
    for (const term of forbiddenTerms) {
      if (text.includes(term)) errors.push(`Legacy/template term "${term}" remains in source: ${rel(file)}`);
    }
  }
}

// 1c) Launch-day freshness gates. Once a site reaches its published release
// date, player-facing pages must not remain in pre-release wording or old
// template taxonomies.
const allSourceText = ['src', 'content']
  .flatMap((root) => {
    const paths = exists(root) && fs.statSync(root).isDirectory() ? walk(root) : [];
    return paths
      .filter((file) => /\.(json|mdx?|tsx?)$/.test(file))
      .filter((file) => !/\.build\.json$/.test(file))
      .map((file) => [file, read(file)]);
  });
const joinedSource = allSourceText.map(([, text]) => text).join('\n');
const releaseDates = [...joinedSource.matchAll(/\b(20\d{2}-\d{2}-\d{2})\b/g)].map((m) => m[1]).sort();
const latestReleaseDate = releaseDates.find((date) => /release|launch|发售|発売|ローンチ/i.test(joinedSource.slice(Math.max(0, joinedSource.indexOf(date) - 160), joinedSource.indexOf(date) + 160)));
if (latestReleaseDate) {
  const today = new Date().toISOString().slice(0, 10);
  if (today >= latestReleaseDate) {
    const staleLaunchPatterns = [
      [/Pre-launch/i, 'pre-launch wording remains after release date'],
      [/pre-release on 20\d{2}-\d{2}-\d{2}/i, 'dated pre-release wording remains after release date'],
      [/Pending launch/i, 'pending launch status remains after release date'],
      [/Unknown before launch/i, 'before-launch unknown remains after release date'],
      [/needs launch verification/i, 'launch-verification placeholder remains after release date'],
    ];
    for (const [file, text] of allSourceText) {
      for (const [pattern, reason] of staleLaunchPatterns) {
        if (pattern.test(text)) errors.push(`${reason}: ${rel(file)}`);
      }
    }
  }
}
const gameTemplateTaxonomy = [
  [/Search a boss, race, skill, or code/i, 'old boss/race/skill/code search placeholder'],
  [/\bProgression\b[\s\S]{0,120}\bRaces\b[\s\S]{0,120}\bBosses\b[\s\S]{0,120}\bRankings\b[\s\S]{0,120}\bCodes\b/i, 'old template filter taxonomy'],
  [/\bActive Codes\b/i, 'codes module label on a non-codes site'],
  [/\bView all codes\b/i, 'codes CTA on a non-codes site'],
];
for (const [file, text] of allSourceText) {
  for (const [pattern, reason] of gameTemplateTaxonomy) {
    if (pattern.test(text)) errors.push(`${reason}: ${rel(file)}`);
  }
}
for (const locale of ['zh-CN', 'ja']) {
  const localeFile = `src/locales/${locale}.json`;
  if (!exists(localeFile)) continue;
  try {
    const parsed = JSON.parse(read(localeFile));
    if (!parsed.home || typeof parsed.home !== 'object') {
      errors.push(`${localeFile} must define a localized home object; a string causes English homepage fallback`);
    }
  } catch {}
}

// 2) Build output checks.
const htmlFiles = walk('out').filter(f => f.endsWith('.html'));
if (!htmlFiles.length) errors.push('No generated HTML files found under out/');
const routeHtml = new Map();
for (const file of htmlFiles) {
  const r = '/' + rel(file).replace(/^out\//, '').replace(/index\.html$/, '').replace(/\.html$/, '/');
  routeHtml.set(r === '/' ? '/' : r, read(file));
}

// 2a) Header/menu consistency for flat launch-page sites.
let configuredNavPaths = [];
if (exists('src/config/navigation.ts')) {
  const navSource = read('src/config/navigation.ts');
  configuredNavPaths = [...navSource.matchAll(/path:\s*["']([^"']+)["']/g)].map((m) => m[1]).filter((href) => href.startsWith('/'));
}
for (const route of ['/', '/zh-CN/', '/ja/']) {
  const file = routeFileFor(route);
  if (!exists(file)) continue;
  const html = read(file);
  const nav = html.match(/<nav[^>]*aria-label="Primary navigation"[\s\S]*?<\/nav>/i)?.[0] || '';
  for (const href of configuredNavPaths) {
    const localizedHref = route === '/' ? href : `/${route.split('/')[1]}${href}`;
    const withoutSlash = localizedHref.replace(/\/$/, '');
    if (exists(routeFileFor(localizedHref)) && !nav.includes(`href="${localizedHref}"`) && !nav.includes(`href="${withoutSlash}"`)) {
      errors.push(`Primary navigation on ${route} omits configured page ${localizedHref}`);
    }
  }
  const emptyWikiSidebar = /Archive index[\s\S]{0,260}Wiki Navigation[\s\S]{0,180}(?:0<!-- --> pages|0\s*pages)/i.test(html);
  if (emptyWikiSidebar) errors.push(`Homepage renders empty Wiki Navigation sidebar on ${route}; hide it or populate it from the same nav source`);
  const homeSources = ['src/app/(en)/page.tsx', 'src/app/[locale]/page.tsx', 'src/app/_locale_disabled/page.tsx']
    .filter(exists)
    .map(read)
    .join('\n');
  if (/WikiSidebar/.test(homeSources) && /Archive index[\s\S]{0,260}Wiki Navigation[\s\S]{0,180}(?:0<!-- --> pages|0\s*pages)/i.test(html)) {
    errors.push(`Homepage source renders WikiSidebar but generated HTML has no populated sidebar on ${route}`);
  }
  if (/Archive index[\s\S]{0,800}(?:Launch Guides|发售指南|ローンチガイド)[\s\S]{0,260}aria-expanded/i.test(html)) {
    errors.push(`Flat launch sidebar on ${route} is rendered as a collapsible tree; use a direct side-nav list`);
  }
}
function routeFileFor(route) {
  if (route === '/') return 'out/index.html';
  return path.join('out', route.replace(/^\//,'').replace(/\/$/,''), 'index.html');
}
const expectedLangs = [['/','en']];
for (const loc of localeFiles.filter((loc) => loc !== 'en')) {
  if (exists(routeFileFor(`/${loc}/`))) expectedLangs.push([`/${loc}/`, loc]);
}
for (const [route, expected] of expectedLangs) {
  const file = routeFileFor(route);
  if (!exists(file)) { errors.push(`Expected route HTML missing: ${file}`); continue; }
  const html = read(file);
  const lang = html.match(/<html[^>]*\slang="([^"]+)"/i)?.[1];
  if (lang !== expected) errors.push(`Wrong raw HTML lang for ${route}: expected ${expected}, got ${lang || '(missing)'}`);
}


// 2b) Locale visible-copy gate. Keep this exact and UI-focused to avoid rejecting game names or Steam labels.
const englishUiResidue = /(?:Independent Game Guide|A focused [^<]{0,120} guide hub covering|Start Beginner Guide|Open Steam Page|Your [^<]{0,80} Route|Jump into the main guide routes|Wiki Navigation|Useful Links|Start Here|Guide Categories|Choose the section that matches|Homepage Modules|Recently Published|Fresh articles generated|View all|Search the wiki|Core guides|Explore systems|Updated 2026|English guides|\bLanguages\b|\bSections\b)/i;
const targetLanguageMarkers = {
  '/es/': /(?:Nivel|Niveles|Ruta|Rutas|Recorrido|Elegir|Buscar|Trampas|Privacidad|Terminos)/i,
  '/pt/': /(?:Fase|Fases|Rota|Rotas|Passo a passo|Escolher|Buscar|Armadilhas|Privacidade|Termos)/i,
  '/zh/': /[\u4E00-\u9FFF]/,
  '/ja/': /[\u3040-\u30FF\u4E00-\u9FFF]/,
  '/ko/': /[\uAC00-\uD7AF]/,
  '/de/': /(?:Unabh|Leitfaden|Einsteiger|Aktualisiert|Nützliche|Abschnitte|Sprachen|Öffne|Kategorien|Suche)/i,
};
for (const [route, marker] of Object.entries(targetLanguageMarkers)) {
  const file = routeFileFor(route);
  if (!exists(file)) continue;
  const html = read(file);
  const hit = html.match(englishUiResidue)?.[0];
  if (hit) errors.push(`Copied English homepage UI remains on ${route}: ${hit}`);
  if (!marker.test(html)) errors.push(`No target-language marker found in generated HTML for ${route}`);
}

const koreanNavWords = /가이드|게임플레이|리뷰|출시|플랫폼|비교|미디어/;
for (const route of ['/', '/zh/', '/ja/', '/de/', '/es/', '/pt/']) {
  const file = routeFileFor(route);
  if (!exists(file)) continue;
  const html = read(file);
  const nav = html.match(/<nav[^>]*aria-label="Primary navigation"[\s\S]*?<\/nav>/i)?.[0] || html.slice(0, 80000);
  if (koreanNavWords.test(nav)) errors.push(`Korean navigation text appears on non-ko route ${route}`);
}


// 2d) Repeated visible labels in navigation-like regions usually means a template
// fallback was copied instead of page-specific text.
for (const [route, html] of routeHtml) {
  if (!['/','/codes/','/best-pickaxes/','/pickaxe-guide/','/start-guide/'].includes(route)) continue;
  const footer = html.match(/<footer[\s\S]*?<\/footer>/i)?.[0] || '';
  const links = visibleLinkLabels(footer).filter((item) => !/^https?:\/\//i.test(item.href));
  const counts = new Map();
  for (const link of links) counts.set(link.label, (counts.get(link.label) || 0) + 1);
  for (const [label, count] of counts) {
    if (count >= 3) errors.push(`Footer repeats link label "${label}" ${count} times on ${route}; replace template fallback labels with page-specific labels`);
  }
  const breadcrumb = html.match(/aria-label="Breadcrumb"[\s\S]*?<\/nav>/i)?.[0] || '';
  if (breadcrumb) {
    const crumbs = visibleLinkLabels(breadcrumb).map((item) => item.label);
    if (crumbs.filter((label) => /^Guide$/i.test(label)).length && !/\/guide\/?/.test(route)) {
      errors.push(`Breadcrumb uses generic "Guide" section label on ${route}`);
    }
  }
}

// 2c) Inner pages must keep the global header/nav. Homepage-only QA misses broken category/article shells.
const nonContentRoutes = new Set(['/404/','/about/','/copyright/','/privacy-policy/','/terms-of-service/','/ads/placeholder/']);
for (const [route, html] of routeHtml) {
  if (route === '/' || /^\/(?:zh|ja|ko|de|es|pt)\/$/.test(route)) continue;
  if (route.startsWith('/ads/')) continue;
  const unlocalized = route.replace(/^\/(?:zh|ja|ko|de|es|pt)(?=\/)/, '');
  if (nonContentRoutes.has(unlocalized)) continue;
  if (!html.includes('aria-label="Primary navigation"')) errors.push(`Global header navigation missing on content route ${route}`);
}

// 3) Asset quality. Check local images referenced in first-page HTML exist and non-empty.
const checkedAssets = new Set();
for (const [route, html] of routeHtml) {
  if (!['/','/zh/','/ja/','/ko/','/de/','/es/','/pt/'].includes(route)) continue;
  if (!allowRemoteYoutubeThumb && /https:\/\/i\.ytimg\.com\//.test(html)) errors.push(`Remote YouTube thumbnail found in first-screen HTML for ${route}; use local public/images asset`);
  for (const term of forbiddenTerms) {
    if (html.includes(term)) errors.push(`Legacy/template term "${term}" appears in generated HTML for ${route}`);
  }
  for (const m of html.matchAll(/(?:src|href)="(\/images\/[^"]+)"/g)) {
    const asset = m[1].split('?')[0];
    checkedAssets.add(asset);
  }
}
for (const asset of checkedAssets) {
  const f = path.join('public', asset.replace(/^\//, ''));
  if (!exists(f)) errors.push(`Referenced image asset missing: ${asset}`);
  else if (fs.statSync(f).size === 0) errors.push(`Referenced image asset is empty: ${asset}`);
  else if (/\.svg$/i.test(asset)) {
    const svg = read(f);
    if (/<text[\s>][\s\S]*>(?:\s*)(?:MO|VV)(?:\s*)<\/text>/i.test(svg)) errors.push(`First-screen SVG image asset contains old template text badge: ${asset}`);
    if (/site-icon\.svg$/i.test(asset) && /<text[\s>][\s\S]*>[A-Z]{1,4}<\/text>/i.test(svg)) errors.push(`Site icon is a temporary text badge, not a launch-ready game icon: ${asset}`);
  }
}


function jpegDimensions(file) {
  const b = fs.readFileSync(file);
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    const len = b.readUInt16BE(i + 2);
    if (len < 2) return null;
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
      return {height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7)};
    }
    i += 2 + len;
  }
  return null;
}
const heroImage = 'public/images/hero-trailer-thumbnail.jpg';
if (exists(heroImage)) {
  const size = fs.statSync(heroImage).size;
  if (size === 0) errors.push('Hero trailer thumbnail is empty: public/images/hero-trailer-thumbnail.jpg');
  const dims = jpegDimensions(heroImage);
  if (dims) {
    if (dims.width < dims.height) errors.push(`Hero trailer thumbnail is portrait (${dims.width}x${dims.height}); use a landscape Steam/official gameplay image`);
    if (dims.width / dims.height < 1.45) errors.push(`Hero trailer thumbnail is not safely landscape (${dims.width}x${dims.height}); expected about 16:9`);
  }
}
const zeroWebp = 'public/images/hero.webp';
if (exists(zeroWebp) && fs.statSync(zeroWebp).size === 0) errors.push('Empty template hero asset remains: public/images/hero.webp');
if (exists('src/app/[locale]/HomePageClient.tsx')) {
  const homeClient = read('src/app/[locale]/HomePageClient.tsx');
  if (exists('src/components/trailer-button.tsx')) {
    if (!/TrailerButton/.test(homeClient)) {
      errors.push('Playable trailer component exists but homepage does not render it; do not regress hero video to a static image');
    }
    if (/TrailerButton/.test(homeClient) && !/videoId=/.test(homeClient)) {
      errors.push('Homepage TrailerButton must include a concrete official trailer videoId');
    }
  }
  if (/hero-trailer-thumbnail\.jpg[\s\S]{0,160}h-full[\s\S]{0,80}min-h-\[260px\][\s\S]{0,80}object-cover/.test(homeClient)) {
    errors.push('Hero image uses tall min-height + object-cover crop; render official 16:9 art in an aspect-video container');
  }
  if (/hero-trailer-thumbnail\.jpg/.test(homeClient) && !/aspect-video/.test(homeClient)) {
    errors.push('Homepage hero image must use an aspect-video container/class to preserve landscape artwork');
  }
}

// 3b) Official asset provenance. If a site records asset evidence, the files must
// still exist and match those hashes. This catches unrelated-but-valid images.
const provenanceFile = 'audit/asset-provenance.json';
let provenance = null;
if (exists(provenanceFile)) {
  try {
    provenance = JSON.parse(read(provenanceFile));
  } catch (error) {
    errors.push(`Invalid asset provenance JSON: ${provenanceFile}`);
  }
  if (provenance) {
    for (const asset of provenanceEntries(provenance)) {
      const name = asset.name || asset.role || asset.file || asset.localPath || '(unnamed)';
      if (!asset || typeof asset !== 'object') {
        errors.push(`Asset provenance entry is invalid: ${name}`);
        continue;
      }
      const localPath = normalizeAssetPath(asset.localPath || asset.file || asset.path);
      if (!localPath || !exists(localPath)) {
        errors.push(`Asset provenance local file missing for ${name}: ${localPath || '(missing)'}`);
        continue;
      }
      if (asset.sha256) {
        const actual = crypto.createHash('sha256').update(fs.readFileSync(localPath)).digest('hex');
        if (actual !== String(asset.sha256).toLowerCase()) {
          errors.push(`Asset provenance hash mismatch for ${name}: ${localPath}`);
        }
      }
      if ((name === 'hero' || name === 'icon' || localPath.includes('/hero')) && !asset.sourceUrl) {
        errors.push(`Asset provenance missing official sourceUrl for ${name}`);
      }
    }
    if (!provenance.expectedGame) {
      errors.push('Asset provenance must include expectedGame');
    }
    if (!provenance.steamAppId && !provenance.placeId && !provenance.universeId) {
      errors.push('Asset provenance must include a platform game id such as steamAppId, placeId, or universeId');
    }
  }
}
const configSource = exists('src/config/game-site.ts') ? read('src/config/game-site.ts') : '';
const steamAppId = configSource.match(/store\.steampowered\.com\/app\/(\d+)/)?.[1] || '';
const robloxPlaceId = configSource.match(/roblox\.com\/games\/(\d+)/)?.[1] || '';
if (robloxPlaceId && checkedAssets.size) {
  if (!provenance) {
    errors.push('Roblox site uses first-screen /images assets but audit/asset-provenance.json is missing');
  } else {
    const byPath = provenanceByLocalPath(provenance);
    if (String(provenance.placeId || provenance.rootPlaceId || '') !== robloxPlaceId) {
      errors.push(`Asset provenance Roblox placeId mismatch: expected ${robloxPlaceId}, got ${provenance.placeId || provenance.rootPlaceId || '(missing)'}`);
    }
    if (!provenance.universeId) {
      errors.push('Asset provenance for Roblox site must include universeId');
    }
    for (const asset of checkedAssets) {
      const localPath = normalizeAssetPath(asset);
      const entry = byPath.get(localPath);
      if (!entry) {
        errors.push(`First-screen Roblox image lacks provenance: ${localPath}`);
        continue;
      }
      const sourceUrl = String(entry.sourceUrl || '');
      if (!sourceUrlMatchesRoblox(sourceUrl)) {
        errors.push(`First-screen Roblox image is not tied to an official Roblox/CDN source: ${localPath}`);
      }
      if (String(entry.placeId || provenance.placeId || provenance.rootPlaceId || '') !== robloxPlaceId) {
        errors.push(`First-screen Roblox image provenance has wrong placeId for ${localPath}`);
      }
      if (!entry.universeId && !provenance.universeId) {
        errors.push(`First-screen Roblox image provenance lacks universeId: ${localPath}`);
      }
    }
  }
}
if (steamAppId && checkedAssets.size) {
  if (!provenance) {
    errors.push('Steam site uses first-screen /images assets but audit/asset-provenance.json is missing');
  } else {
    const byPath = provenanceByLocalPath(provenance);
    if (String(provenance.steamAppId || '') !== steamAppId) {
      errors.push(`Asset provenance steamAppId mismatch: expected ${steamAppId}, got ${provenance.steamAppId || '(missing)'}`);
    }
    for (const asset of checkedAssets) {
      const localPath = normalizeAssetPath(asset);
      const entry = byPath.get(localPath);
      if (!entry) {
        errors.push(`First-screen Steam image lacks provenance: ${localPath}`);
        continue;
      }
      const sourceUrl = String(entry.sourceUrl || '');
      if (!sourceUrl.includes(`steam/apps/${steamAppId}/`) && !sourceUrl.includes(`steampowered.com/app/${steamAppId}`)) {
        errors.push(`First-screen Steam image is not tied to app ${steamAppId}: ${localPath}`);
      }
    }
  }
}

// 4) Header logo and browser/app icon placeholder checks.
if (!allowTextLogo && exists('src/components/site.tsx')) {
  const site = read('src/components/site.tsx');
  if (/font-black[^>]*>(?:MO|VV|[A-Z]{1,4})<\/span>/.test(site)) errors.push('Temporary text logo badge remains in src/components/site.tsx; use a real icon/SVG/image');
  if (/\/images\/site-icon\.svg/.test(site) && exists('public/images/site-icon.svg')) {
    const svg = read('public/images/site-icon.svg');
    if (/<text[\s>][\s\S]*>[A-Z]{1,4}<\/text>/i.test(svg)) errors.push('Header uses temporary text-only site-icon.svg; replace with a real game-derived icon image');
  }
}
{
  const iconFiles = {
    'public/favicon.ico': null,
    'public/favicon-16x16.png': [16, 16],
    'public/favicon-32x32.png': [32, 32],
    'public/apple-touch-icon.png': [180, 180],
    'public/android-chrome-192x192.png': [192, 192],
    'public/android-chrome-512x512.png': [512, 512],
  };
  const templateIconHashes = new Set([
    'eb8cd01f4c198887', '78039fd16333d6ae', 'fee477054cde01d1',
    '8d5024483012410c', 'df5020b940d6c3fa', 'abb684bc1870ce8a',
  ]);
  for (const [file, expectedSize] of Object.entries(iconFiles)) {
    if (!exists(file)) {
      errors.push(`Missing browser/app icon asset: ${file}`);
      continue;
    }
    const buf = fs.readFileSync(file);
    if (buf.length < 300) errors.push(`Browser/app icon asset is suspiciously tiny: ${file}`);
    const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
    if (templateIconHashes.has(hash)) errors.push(`Template browser/app icon hash remains: ${file}`);
    if (/\.png$/i.test(file) && !(buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)) {
      errors.push(`Browser/app icon is not a valid PNG: ${file}`);
    } else if (expectedSize) {
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      if (width !== expectedSize[0] || height !== expectedSize[1]) errors.push(`Browser/app icon has wrong dimensions: ${file} (${width}x${height})`);
    }
    if (/\.ico$/i.test(file) && !(buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00)) {
      errors.push(`favicon.ico is not a valid ICO file: ${file}`);
    }
  }
  for (const file of ['src/app/favicon.ico', 'src/app/icon.png', 'src/app/apple-icon.png']) {
    if (!exists(file)) errors.push(`Missing Next.js metadata icon asset: ${file}`);
  }
  for (const manifestFile of ['public/manifest.json', 'public/site.webmanifest']) {
    if (!exists(manifestFile)) {
      errors.push(`Missing browser manifest asset: ${manifestFile}`);
      continue;
    }
    const manifest = read(manifestFile);
    for (const required of ['android-chrome-192x192.png', 'android-chrome-512x512.png']) {
      if (!manifest.includes(required)) errors.push(`${manifestFile} does not reference ${required}`);
    }
  }
  const rootHtml = exists('out/index.html') ? read('out/index.html') : '';
  for (const required of ['site.webmanifest', 'favicon.ico', 'favicon-32x32.png', 'apple-touch-icon.png']) {
    if (rootHtml && !rootHtml.includes(required)) errors.push(`Root HTML does not advertise browser/app icon asset: ${required}`);
  }
  const headerIcon = ['public/images/site-icon.jpg', 'public/images/site-icon.png', 'public/images/site-icon.webp']
    .find((file) => exists(file));
  if (headerIcon) {
    const headerMtime = fs.statSync(headerIcon).mtimeMs;
    for (const file of Object.keys(iconFiles).filter((item) => item !== 'public/favicon.ico')) {
      if (exists(file) && fs.statSync(file).mtimeMs + 1000 < headerMtime) {
        errors.push(`Browser/app icon predates current header icon ${headerIcon}: ${file}`);
      }
    }
  }
}

// 5) Production origin canonicalization must run before static assets.
if (domain) {
  if (!exists('wrangler.jsonc')) errors.push('wrangler.jsonc is required for production origin QA');
  const workerPath = exists('src/worker.ts') ? 'src/worker.ts' : (exists('src/worker.js') ? 'src/worker.js' : '');
  if (!workerPath) errors.push('src/worker.ts or src/worker.js is required for production origin QA');
  if (exists('wrangler.jsonc')) {
    const wrangler = read('wrangler.jsonc');
    if (!/"main"\s*:\s*"\.\/src\/worker\.(?:ts|js)"/.test(wrangler) && !/main\s*=\s*["']\.\/src\/worker\.(?:ts|js)["']/.test(wrangler)) errors.push('wrangler.jsonc must route through ./src/worker.ts or ./src/worker.js');
    if (!/"binding"\s*:\s*"ASSETS"/.test(wrangler)) errors.push('wrangler.jsonc must expose the ASSETS binding');
    if (!/"run_worker_first"\s*:\s*true/.test(wrangler)) errors.push('wrangler.jsonc must run the Worker before static assets');
  }
  if (workerPath) {
    const worker = read(workerPath);
    if (!/protocol\s*!==\s*["']https:["']/.test(worker)) errors.push('Worker must canonicalize HTTP requests to HTTPS');
    if (!/hostname\.startsWith\(["']www\.["']\)/.test(worker) && !/hostname\s*!==\s*CANONICAL_HOST/.test(worker)) errors.push('Worker must canonicalize www/non-canonical hosts to the apex host');
    if (!/Response\.redirect\([\s\S]*?,\s*(?:301|308)\)/.test(worker)) errors.push('Worker canonical redirects must use status 301 or 308');
  }
}

if (errors.length) {
  console.error('visible_qa=failed');
  for (const e of errors) console.error(`ERROR: ${e}`);
  for (const w of warnings) console.error(`WARN: ${w}`);
  process.exit(1);
}
console.log(JSON.stringify({visible_qa:'ok', checkedRoutes: expectedLangs.map(([r])=>r), checkedAssets:[...checkedAssets].sort()}));
NODE
