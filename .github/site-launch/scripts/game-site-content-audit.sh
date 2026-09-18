#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  game-site-content-audit.sh <site-dir> [domain]

Audits generated game/wiki sites for launch-quality content and visual-source
mistakes that normal SEO checks can miss:
  - cross-game article contamination from SEO/article generation;
  - invented or unverified Roblox codes/rewards;
  - false "official" Discord/YouTube/media labels;
  - old template logo/video/hero residue;
  - stale content categories and broken homepage module hrefs;
  - built HTML still containing forbidden residue.

Environment:
  GAME_SITE_CONTENT_AUDIT_FORBIDDEN="a,b,c"  Extra comma-separated terms.
  GAME_SITE_CONTENT_AUDIT_ALLOW_YOUTUBE=1    Allow YouTube embeds/references.
  GAME_SITE_CONTENT_AUDIT_ALLOW_OFFICIAL=1   Allow official Discord/YouTube labels.
  GAME_SITE_CONTENT_AUDIT_ALLOW_SVG_ICON=1   Allow header /images/site-icon.svg.
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

GAME_SITE_CONTENT_AUDIT_DOMAIN="$DOMAIN" node <<'NODE'
const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];
const allowYoutube = process.env.GAME_SITE_CONTENT_AUDIT_ALLOW_YOUTUBE === '1';
const allowOfficial = process.env.GAME_SITE_CONTENT_AUDIT_ALLOW_OFFICIAL === '1';
const allowSvgIcon = process.env.GAME_SITE_CONTENT_AUDIT_ALLOW_SVG_ICON === '1';
const extraForbidden = (process.env.GAME_SITE_CONTENT_AUDIT_FORBIDDEN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const sourceRoots = ['src', 'content', 'public/manifest.json', 'public/ads', 'public/ads.txt'];
const adEnvContractFiles = new Set(['app/adsterra-env-ads.tsx', 'src/components/adsterra-env-ads.tsx', 'src/components/ad-env-ads.tsx']);
const outputRoots = ['out'];
const textExt = /\.(?:json|mdx?|tsx?|jsx?|html|txt|svg|xml|webmanifest)$/i;

const forbidden = [
  ...extraForbidden.map((term) => ({ kind: 'extra_forbidden', pattern: literal(term), display: term })),
  { kind: 'wrong_game', pattern: /Jagged Alliance|Terraria|Old One's Army|Old One|Battle Brothers|One Page Rules|Grimdark|Dungeon Defenders|Dark Mage|Betsy|Megashark|Xenopopper|Roblox Studio|LocalScript/i },
  { kind: 'fake_codes', pattern: /PLASMABLAST|GOLDENRPG|HEAVYDEFENSE|Scruffy|244466666|Late Christmas|FULLRELEASE|75KLIKES|Manipulator|Clan Reroll|Ability Reroll|Diamond Shotgun|Diamond Submachine|Rusty Spawner/i },
  { kind: 'legacy_template', pattern: /VV: ULTIMATUM|VV Ultimatum|Shinigami|Quincy|Hollow|hero-trailer-thumbnail|site-icon\.svg|鉁/i },
  { kind: 'stale_category', pattern: /choose a race|compare skills|locate routes|builds,\s*races|\/guns\b|\/tools\b/i },
  { kind: 'generic_route_shell', pattern: /Launch Routes|Route Table|current working frame|official facts and route scope|core system path and jump into the matching guide|Copied template contract for autonomous static launch|<main\s*\/>/i },
  { kind: 'internal_planning_copy', pattern: /\b(?:this|the)\s+(?:site|wiki|page)\s+should\s+(?:treat|track|define|become|serve)\b|\brecords?\s+that\s+will\s+be\s+expanded\b|\bafter\s+(?:direct\s+)?in[- ]game\s+(?:capture|verification|review)\b|\bapproved\s+(?:site\s+)?plan\b|\bpage\s+evidence\s+package\b|(?:^|[\s\"'(])\/?content\/evidence\/[^\s\"')<>]+|(?:[A-Z]:[\\/](?:Users|home)[\\/]|\/(?:home|Users)\/)|^\s*#{1,6}\s*(?:data model|launch use|source trail|evidence[- ]backed facts)\s*$/im },
  { kind: 'first_launch_ads', pattern: /\badsterra\b|adsbygoogle|googlesyndication|doubleclick\.(?:net|com)|highrevenueformat|highperformanceformat|effectivecpmnetwork|profitableratecpm|atOptions|NativeContentAd|StickyTopAd|AdSlot|\/ads\//i },
];

function literal(value) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}
function exists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}
function read(p) {
  return fs.readFileSync(p, 'utf8');
}
function stat(p) {
  try { return fs.statSync(p); } catch { return null; }
}
function walk(target, files = []) {
  if (!exists(target)) return files;
  const s = stat(target);
  if (!s) return files;
  if (s.isFile()) {
    files.push(target);
    return files;
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (['node_modules', '.git', '.next', '.wrangler'].includes(entry.name)) continue;
    walk(path.join(target, entry.name), files);
  }
  return files;
}
function rel(p) {
  return path.relative(process.cwd(), p).replaceAll(path.sep, '/');
}
function addError(kind, file, line, match) {
  errors.push(`${kind}: ${rel(file)}:${line}: ${match}`);
}
function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

const sourceFiles = sourceRoots.flatMap((root) => walk(root)).filter((file) => textExt.test(file));
const outputFiles = outputRoots.flatMap((root) => walk(root)).filter((file) => textExt.test(file));
const allTextFiles = [...sourceFiles, ...outputFiles];
const noCjkVisibleFiles = allTextFiles.filter((file) => {
  const relativeFile = rel(file);
  return relativeFile === 'src/locales/en.json' || relativeFile.startsWith('content/en/');
});
const englishContentFiles = allTextFiles.filter((file) => rel(file).startsWith('content/en/'));

for (const file of allTextFiles) {
  const relativeFile = rel(file);
  const isGenericYouTubeSupport =
    relativeFile === 'src/components/mdx/YouTubeEmbed.tsx' ||
    relativeFile === 'src/components/trailer-button.tsx' ||
    relativeFile === 'src/app/[locale]/HomePageClient.tsx';
  const isCompiledNextChunk = relativeFile.startsWith('out/_next/static/chunks/');
  const isAdEnvContract = adEnvContractFiles.has(relativeFile);
  const text = read(file);
  for (const rule of forbidden) {
    if (isAdEnvContract && rule.kind === 'first_launch_ads' && text.includes('NEXT_PUBLIC_AD_')) continue;
    if (rule.kind === 'generic_route_shell' && /\.build\.json$/.test(relativeFile)) continue;
    const match = text.match(rule.pattern);
    if (match) addError(rule.kind, file, lineOf(text, match.index || 0), match[0]);
  }
  if (!allowOfficial && /Official media|Official Discord|Official YouTube|Gun Planner/i.test(text)) {
    const match = text.match(/Official media|Official Discord|Official YouTube|Gun Planner/i);
    addError('false_official_label', file, lineOf(text, match.index || 0), match[0]);
  }
  if (!allowYoutube && !isGenericYouTubeSupport && !isCompiledNextChunk && /youtube\.com\/embed|youtu\.be\/|i\.ytimg\.com|<TrailerButton\b|\bvideoId=|hero-trailer-thumbnail/i.test(text)) {
    const match = text.match(/youtube\.com\/embed|youtu\.be\/|i\.ytimg\.com|<TrailerButton\b|\bvideoId=|hero-trailer-thumbnail/i);
    addError('unsupported_youtube_media', file, lineOf(text, match.index || 0), match[0]);
  }
}

for (const file of noCjkVisibleFiles) {
  const text = read(file);
  const match = text.match(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/);
  if (match) addError('visible_cjk_text', file, lineOf(text, match.index || 0), match[0]);
}

for (const file of englishContentFiles) {
  const text = read(file);
  const match = text.match(/Conservative Build a Gun Army guide based on verified Roblox-page research|## What to verify in game|## Practical checklist/i);
  if (match) addError('thin_template_article', file, lineOf(text, match.index || 0), match[0]);
}

if (exists('src/components/site.tsx')) {
  const site = read('src/components/site.tsx');
  if (!allowSvgIcon && /\/images\/site-icon\.svg/.test(site)) {
    errors.push('site_icon: src/components/site.tsx still references /images/site-icon.svg; use a real game-derived bitmap/icon');
  }
  if (/font-black[^>]*>\s*[A-Z]{1,4}\s*<\/span>/.test(site)) {
    errors.push('site_icon: src/components/site.tsx contains a temporary text logo badge');
  }
}

for (const image of ['public/images/site-icon.svg', 'public/images/hero-trailer-thumbnail.jpg']) {
  if (!exists(image)) continue;
  if (image.endsWith('.svg') && !allowSvgIcon) {
    const svg = read(image);
    if (/<text[\s>][\s\S]*>[A-Z]{1,4}<\/text>/i.test(svg) || /linearGradient[\s\S]*(?:blade|VV|MO|ULTIMATUM)/i.test(svg)) {
      errors.push(`asset_residue: ${image} looks like a generated/template icon; use the game's official thumbnail or a game-derived asset`);
    }
  }
  if (image.includes('hero-trailer-thumbnail')) {
    errors.push(`asset_residue: ${image} uses trailer-thumbnail naming; rename to verified hero-cover/game-thumbnail asset unless an official trailer is proven`);
  }
}

for (const image of ['public/images/site-icon.png', 'public/images/hero-cover.jpg', 'public/images/hero.webp']) {
  if (exists(image) && stat(image).size === 0) {
    errors.push(`asset_empty: ${image} exists but is empty`);
  }
}

function parseNavigationTypes() {
  const cfg = 'src/config/navigation.ts';
  if (!exists(cfg)) return [];
  const text = read(cfg);
  return [...text.matchAll(/path:\s*["']\/([^"']+)["']/g)].map((m) => m[1]).filter(Boolean);
}
const navTypes = parseNavigationTypes();
if (navTypes.length) {
  const allowed = new Set(navTypes);
  for (const dir of walk('content').filter((p) => stat(p)?.isDirectory?.())) {
    const parts = rel(dir).split('/');
    if (parts.length === 3 && parts[0] === 'content') {
      const type = parts[2];
      if (!allowed.has(type)) errors.push(`content_type: content directory ${rel(dir)} is not in NAVIGATION_CONFIG`);
    }
  }
}

function routeExists(href) {
  if (/^(?:https?:|mailto:|#)/.test(href)) return true;
  const clean = href.split('#')[0].split('?')[0].replace(/\/$/, '');
  if (!clean || clean === '/') return true;
  const assetPath = path.join('out', clean.replace(/^\//, ''));
  if (exists(assetPath) && stat(assetPath)?.isFile()) return true;
  if (exists(path.join('out', clean.replace(/^\//, ''), 'index.html'))) return true;
  if (exists(path.join('out', clean.replace(/^\//, '') + '.html'))) return true;
  return false;
}
if (exists('out')) {
  const hrefPattern = /href="([^"]+)"/g;
  const h1ExemptRoutes = new Set([
    '/about/',
    '/copyright/',
    '/privacy-policy/',
    '/terms-of-service/',
  ]);
  for (const file of outputFiles.filter((f) => f.endsWith('.html'))) {
    const html = read(file);
    const route = '/' + rel(file).replace(/^out\//, '').replace(/index\.html$/, '').replace(/\.html$/, '/');
    const normalizedRoute = route === '/' ? '/' : route;
    const unlocalizedRoute = normalizedRoute.replace(/^\/(?:de|es|pt|zh|ja|ko)(?=\/)/, '');
    if (!/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)) {
      const h1Count = (html.match(/<h1\b/gi) || []).length;
      if (!h1ExemptRoutes.has(unlocalizedRoute) && h1Count !== 1) errors.push(`html_h1: ${rel(file)} must contain exactly one H1; found ${h1Count}`);
    }
    for (const match of html.matchAll(hrefPattern)) {
      const href = match[1];
      if (!href.startsWith('/')) continue;
      if (href.startsWith('/_next/') || href.startsWith('/images/') || href === '/favicon.ico') continue;
      if (!routeExists(href)) addError('broken_internal_href', file, lineOf(html, match.index || 0), href);
    }
  }
} else {
  warnings.push('out/ not found; skipped built HTML internal-link audit');
}

if (errors.length) {
  console.error('game_site_content_audit=failed');
  for (const error of errors) console.error(`ERROR: ${error}`);
  for (const warning of warnings) console.error(`WARN: ${warning}`);
  process.exit(1);
}
console.log(JSON.stringify({
  game_site_content_audit: 'ok',
  checkedSourceFiles: sourceFiles.length,
  checkedOutputFiles: outputFiles.length,
  domain: process.env.GAME_SITE_CONTENT_AUDIT_DOMAIN || undefined,
}));
NODE
