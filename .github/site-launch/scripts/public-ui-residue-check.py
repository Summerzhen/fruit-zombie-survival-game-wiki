#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

FORBIDDEN_PATTERNS = {
    r"\bSearch a boss\b": "old combat-template search placeholder",
    r"\bSearch guides, bosses\b": "old combat-template search placeholder",
    r"\bBrowse Boss Guides\b": "old combat-template 404 CTA",
    r"\bProgression\s*/\s*Races\s*/\s*Bosses\b": "old combat-template filters",
    r"\bRaces\b": "old race category visible copy",
    r"\bBosses\b": "old boss category visible copy",
    r"\bSkills\b": "old skill category visible copy",
    r"\bRankings\b": "old rankings category visible copy",
    r"\btier-list\b": "old tier-list category",
    r"\bfield archive\b": "internal editorial language",
    r"\bend of record\b": "internal editorial language",
    r"\blaunch pass\b": "internal launch language",
    r"\bBuilding your site\b": "internal site-builder language",
    r"\bsite is taking shape\b": "internal site-builder language",
    r"\bfirst version will appear here automatically\b": "internal site-builder language",
    r"\brequired sections?\b": "internal editorial language",
    r"\bpage blueprint\b": "internal editorial language",
    r"\bpending data\b": "internal editorial language",
    r"\bblocked by recheck\b": "internal review status",
    r"\bdata layer pending\b": "internal data-readiness status",
    r"\b(?:thread |source |route )?evidence pending\b": "internal evidence status",
    r"\bverification required\b": "internal verification status",
    r"\bpublished field notes\b": "internal editorial language",
    r"\blong-term moat\b": "internal strategy language",
    r"\bfirst batch targets\b": "internal strategy language",
    r"\bcapture checklist\b": "internal capture language",
    r"\bsource trail\b": "internal evidence language",
    r"\bdata model\b": "internal planning language",
    r"\bwithout fake\b": "internal anti-fabrication language",
    r"\bno fake\b": "internal anti-fabrication language",
    r"\bDo not copy competitor\b": "internal competitor language",
}

PUBLIC_DIRS = ("src/app", "src/components", "src/locales", "content")
TEXT_SUFFIXES = {".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".mdx", ".html", ".txt"}
FIRST_LAUNCH_AD_FILES = (
    "src/components/adsterra-ads.tsx",
    "public/ads.txt",
)
AD_ENV_CONTRACT_FILES = (
    "app/adsterra-env-ads.tsx",
    "src/components/adsterra-env-ads.tsx",
    "src/components/ad-env-ads.tsx",
)
FIRST_LAUNCH_AD_DIRS = (
    "public/ads",
)
AD_PATTERNS = {
    r"\badsterra\b": "first launch must not include Adsterra residue",
    r"\badsbygoogle\b": "first launch must not include Google ad scripts",
    r"\bgooglesyndication\b": "first launch must not include Google ad domains",
    r"\bdoubleclick\b": "first launch must not include ad domains",
    r"\bhighrevenueformat\b": "first launch must not include Adsterra script domains",
    r"\bhighperformanceformat\b": "first launch must not include Adsterra script domains",
    r"\beffectivecpmnetwork\b": "first launch must not include ad script domains",
    r"\bprofitableratecpm\b": "first launch must not include ad script domains",
    r"\batOptions\b": "first launch must not include Adsterra atOptions blocks",
    r"\bNativeContentAd\b": "first launch must not render delayed ad components",
    r"\bStickyTopAd\b": "first launch must not render delayed ad components",
    r"\bAdSlot\b": "first launch must not render delayed ad components",
    r"/ads/": "first launch must not reference local ad iframes",
}

def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: public-ui-residue-check.py <site-dir>", file=sys.stderr)
        return 2
    site = Path(sys.argv[1]).resolve()
    failures: list[str] = []
    ad_env_contract_files = {rel for rel in AD_ENV_CONTRACT_FILES if (site / rel).is_file()}
    delayed_adsterra = (site / "public/.delayed-adsterra").is_file() or (site / ".delayed-adsterra").is_file()
    if not delayed_adsterra:
        for rel in FIRST_LAUNCH_AD_FILES:
            if (site / rel).is_file():
                failures.append(f"{rel}: first launch must not ship ad files before delayed-adsterra")
        for rel in FIRST_LAUNCH_AD_DIRS:
            ad_dir = site / rel
            if ad_dir.is_dir() and any(path.is_file() for path in ad_dir.rglob("*")):
                failures.append(f"{rel}: first launch must not ship ad directories before delayed-adsterra")
    for root_name in PUBLIC_DIRS:
        root = site / root_name
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
                continue
            rel = path.relative_to(site).as_posix()
            text = path.read_text(encoding="utf-8", errors="ignore")
            for pattern, reason in FORBIDDEN_PATTERNS.items():
                if re.search(pattern, text, flags=re.I):
                    failures.append(f"{rel}: {reason}: /{pattern}/")
            if delayed_adsterra:
                continue
            for pattern, reason in AD_PATTERNS.items():
                if rel in ad_env_contract_files and "NEXT_PUBLIC_AD_" in text:
                    continue
                if re.search(pattern, text, flags=re.I):
                    failures.append(f"{rel}: {reason}: /{pattern}/")
    if failures:
        print("public_ui_residue_check=failed")
        for failure in failures[:80]:
            print(f"ERROR: {failure}")
        if len(failures) > 80:
            print(f"ERROR: plus {len(failures) - 80} more failures")
        return 1
    print("public_ui_residue_check=ok")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
