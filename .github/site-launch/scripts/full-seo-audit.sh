#!/usr/bin/env bash
set -euo pipefail
usage(){ echo "Usage: full-seo-audit.sh <site-dir> <domain>" >&2; }
SITE_DIR="${1:-}"; DOMAIN="${2:-}"
[[ -n "$SITE_DIR" && -n "$DOMAIN" ]] || { usage; exit 2; }
SITE_DIR="$(realpath -m "$SITE_DIR")"
cd "$SITE_DIR"
[[ -d out ]] || { echo "ERROR: full SEO audit requires built ./out" >&2; exit 1; }
SEO_AUDIT_DOMAIN="$DOMAIN" node <<'NODE'
const fs=require('fs');
const path=require('path');
const rawDomain=process.env.SEO_AUDIT_DOMAIN || '';
const domain=rawDomain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
const errors=[];
function exists(p){return fs.existsSync(p)}
function read(p){return fs.readFileSync(p,'utf8')}
function walk(dir, files=[]){ if(!exists(dir)) return files; for(const e of fs.readdirSync(dir,{withFileTypes:true})){ const f=path.join(dir,e.name); if(e.isDirectory()) walk(f,files); else files.push(f); } return files; }
function rel(p){return path.relative(process.cwd(),p).replaceAll(path.sep,'/')}
function routeFromFile(file){ let r='/' + rel(file).replace(/^out\//,'').replace(/index\.html$/,'').replace(/\.html$/,'/'); return r==='/'?'/':r; }
const site=`https://${domain}`;
const htmlFiles=walk('out').filter(f=>f.endsWith('.html'));
if(!htmlFiles.length) errors.push('No generated HTML under out/');
if(exists('out/en')) errors.push('Generated /en directory exists; default English must be root paths only');
const sitemap=exists('out/sitemap.xml')?read('out/sitemap.xml'):'';
if(!sitemap) errors.push('out/sitemap.xml missing');
if(new RegExp(`https://${domain.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}/en(?:/|<)`).test(sitemap)) errors.push('Sitemap contains /en URLs');
if(/<loc>[^<]*\/en(?:\/|<\/loc>)/.test(sitemap)) errors.push('Sitemap loc contains /en path');
for(const file of htmlFiles){
  const html=read(file); const route=routeFromFile(file);
  if(route.startsWith('/en/') || route==='/en') errors.push(`Generated English-prefixed HTML exists: ${route} (${rel(file)})`);
  const canon=html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] || '';
  if(route.startsWith('/ads/')) continue;
  if(canon){
    if(!canon.startsWith(`${site}/`) && canon !== site) errors.push(`Canonical must be an absolute production URL on ${route}: ${canon}`);
    if(canon.includes(`://${domain}/en/`) || canon.endsWith(`://${domain}/en`)) errors.push(`Canonical contains /en on ${route}: ${canon}`);
    if(canon.startsWith(site)) {
      const u=new URL(canon);
      if(u.pathname !== route && !(route==='/' && u.pathname==='/')) errors.push(`Canonical path mismatch on ${route}: ${canon}`);
    }
  } else if(!route.includes('/404')) errors.push(`Canonical missing on ${route}`);
  for(const m of html.matchAll(/hreflang="(?:en|x-default)" href="([^"]+)"/g)){
    if(!m[1].startsWith(`${site}/`) && m[1] !== site) errors.push(`hreflang must be an absolute production URL on ${route}: ${m[1]}`);
    if(m[1].includes(`://${domain}/en/`) || m[1].endsWith(`://${domain}/en`)) errors.push(`hreflang en/x-default contains /en on ${route}: ${m[1]}`);
  }
  for(const m of html.matchAll(/href="([^"]+)"/g)){
    const href=m[1];
    if(href==='/en' || href.startsWith('/en/') || href.includes(`://${domain}/en/`) || href.endsWith(`://${domain}/en`)) errors.push(`Internal href contains /en on ${route}: ${href}`);
  }
  if(/VV: ULTIMATUM|VV Ultimatum|ULTIMATUM|Shinigami|Quincy|Hollow/i.test(html)) errors.push(`Legacy template/game term appears in generated HTML: ${route}`);
}
if(errors.length){ console.error('full_seo_audit=failed'); for(const e of errors) console.error('ERROR: '+e); process.exit(1); }
console.log(JSON.stringify({full_seo_audit:'ok', domain, htmlFiles:htmlFiles.length}));
NODE
