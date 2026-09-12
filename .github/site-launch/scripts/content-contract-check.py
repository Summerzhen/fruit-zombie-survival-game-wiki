#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
import html
import json
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

META_RE = re.compile(r"export\s+const\s+metadata\s*=\s*\{(?P<body>.*?)\};", re.S)
STRING_RE = re.compile(r"(?P<key>\w+)\s*:\s*(?P<value>false|true|\"[^\"]*\")")
DATA_PAGE_RE = re.compile(r"\b(database|catalog|directory|map|tracker)\b", re.I)
PENDING_RE = re.compile(r"\b(pending|needs in-game check|not verified yet|still being verified)\b", re.I)
HREF_RE = re.compile(r"<a\b[^>]*\bhref\s*=\s*([\"'])(?P<href>.*?)\1", re.I | re.S)
SITEMAP_LOC_RE = re.compile(r"<loc>(?P<url>[^<]+)</loc>", re.I)

def metadata(text: str) -> dict[str, object]:
    match = META_RE.search(text)
    if not match:
        return {}
    data: dict[str, object] = {}
    for item in STRING_RE.finditer(match.group("body")):
        raw = item.group("value")
        if raw == "true":
            value: object = True
        elif raw == "false":
            value = False
        else:
            value = raw.strip('"')
        data[item.group("key")] = value
    return data

def body_after_metadata(text: str) -> str:
    match = META_RE.search(text)
    return text[match.end():] if match else text

def word_count(text: str) -> int:
    return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'-]*", text))

def rendered_text(text: str) -> str:
    text = re.sub(r"<script\b.*?</script>|<style\b.*?</style>", " ", text, flags=re.I | re.S)
    text = re.sub(r"<[^>]+>", " ", text)
    return html.unescape(re.sub(r"\s+", " ", text)).strip()


def read_json_object(path: Path) -> dict[str, Any] | None:
    try:
        payload = json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


def normalize_route(value: Any) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""
    path = urlsplit(raw).path if "://" in raw else raw.split("?", 1)[0].split("#", 1)[0]
    if not path.startswith("/"):
        path = "/" + path
    path = re.sub(r"/{2,}", "/", path)
    return path if path == "/" else path.rstrip("/") + "/"


def planning_contract(site: Path) -> tuple[dict[str, Any] | None, Path | None, list[str]]:
    warnings: list[str] = []
    for root in (site, site.parent):
        path = root / "requirements" / "site-plan.json"
        if not path.is_file():
            continue
        payload = read_json_object(path)
        if payload is None:
            warnings.append(f"{path}: unreadable site plan; launch coverage contract skipped")
            return None, None, warnings
        return payload, root, warnings
    return None, None, warnings


def output_route_exists(out: Path, route: str) -> bool:
    if route == "/":
        return (out / "index.html").is_file()
    relative = route.strip("/")
    return (out / relative / "index.html").is_file() or (out / f"{relative}.html").is_file()


def launch_coverage_failures(site: Path) -> tuple[list[str], list[str]]:
    plan, project, warnings = planning_contract(site)
    if not plan or project is None:
        return [], warnings
    launch_pages = plan.get("launchPages")
    if not isinstance(launch_pages, list):
        return [], warnings
    required_pages = [
        page for page in launch_pages
        if isinstance(page, dict) and str(page.get("priority") or "").upper() in {"P0", "P1"}
    ]
    if not required_pages:
        return [], warnings

    failures: list[str] = []
    briefs_path = project / "content" / "page-briefs.json"
    briefs_payload = read_json_object(briefs_path) if briefs_path.is_file() else None
    briefs = briefs_payload.get("briefs") if isinstance(briefs_payload, dict) else None
    brief_by_route = {
        normalize_route(brief.get("url")): brief
        for brief in briefs or []
        if isinstance(brief, dict) and normalize_route(brief.get("url"))
    }

    out = site / "out"
    homepage_path = out / "index.html"
    homepage = homepage_path.read_text(encoding="utf-8", errors="ignore") if homepage_path.is_file() else ""
    homepage_links = {
        normalize_route(html.unescape(match.group("href")))
        for match in HREF_RE.finditer(homepage)
        if not match.group("href").lower().startswith(("mailto:", "tel:", "javascript:"))
    }
    sitemap_path = out / "sitemap.xml"
    sitemap = sitemap_path.read_text(encoding="utf-8", errors="ignore") if sitemap_path.is_file() else ""
    sitemap_routes = {normalize_route(html.unescape(match.group("url"))) for match in SITEMAP_LOC_RE.finditer(sitemap)}

    for page in required_pages:
        page_id = str(page.get("id") or "unnamed")
        route = normalize_route(page.get("url"))
        prefix = f"launch page {page_id} ({str(page.get('priority')).upper()})"
        if not route:
            failures.append(f"{prefix}: missing url")
            continue
        brief = brief_by_route.get(route)
        if brief is None:
            failures.append(f"{prefix}: no matching page brief for {route}")
        elif str(brief.get("generationStatus") or "").lower() == "blocked":
            failures.append(f"{prefix}: matching brief is blocked for {route}")
        if not output_route_exists(out, route):
            failures.append(f"{prefix}: built route missing for {route}")
        if route != "/" and route not in homepage_links:
            failures.append(f"{prefix}: homepage/navigation lacks crawlable link to {route}")
        if route not in sitemap_routes:
            failures.append(f"{prefix}: sitemap missing {route}")
    return failures, warnings


def validate(site: Path) -> tuple[list[str], list[str]]:
    content = site / "content"
    failures: list[str] = []
    warnings: list[str] = []
    if content.is_dir():
        for path in content.rglob("*.mdx"):
            rel = path.relative_to(site).as_posix()
            text = path.read_text(encoding="utf-8", errors="ignore")
            body = body_after_metadata(text)
            meta = metadata(text)
            indexable = meta.get("indexable") is not False
            if re.search(r"^#\s+", body, flags=re.M):
                failures.append(f"{rel}: body must not contain H1; layout owns the page H1")
            if re.search(r"^#{1,3}\s+Table of Contents\b|\bTable of Contents\b", body, flags=re.I | re.M):
                failures.append(f"{rel}: article body must not include Table of Contents when layout TOC exists")
            title_desc = f"{meta.get('title','')} {meta.get('description','')} {meta.get('summary','')}"
            is_data = DATA_PAGE_RE.search(rel) or DATA_PAGE_RE.search(title_desc)
            if indexable and is_data and PENDING_RE.search(text):
                failures.append(f"{rel}: pending/partial data page must be noindex until it has real row-level entities")
            if indexable and rel.startswith("content/en/") and word_count(body) < 520:
                failures.append(f"{rel}: thin indexable page ({word_count(body)} words); add player steps, failure modes, FAQ, and source-linked evidence")
    out = site / "out"
    if out.is_dir():
        for route in ("/", "/release-date/", "/controls/", "/known-issues/", "/achievements/"):
            html_path = out / "index.html" if route == "/" else out / route.strip("/") / "index.html"
            if not html_path.is_file():
                continue
            count = word_count(rendered_text(html_path.read_text(encoding="utf-8", errors="ignore")))
            if count < 520:
                failures.append(f"rendered route {route} is thin ({count} words); expand the actual page component, not only MDX source")
    coverage_failures, coverage_warnings = launch_coverage_failures(site)
    failures.extend(coverage_failures)
    warnings.extend(coverage_warnings)
    return failures, warnings

def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: content-contract-check.py <site-dir>", file=sys.stderr)
        return 2
    site = Path(sys.argv[1]).resolve()
    failures, warnings = validate(site)
    if warnings:
        for warning in warnings[:80]:
            print(f"WARNING: {warning}")
    if failures:
        print("content_contract_check=failed")
        for failure in failures[:80]:
            print(f"ERROR: {failure}")
        return 1
    print("content_contract_check=ok")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
