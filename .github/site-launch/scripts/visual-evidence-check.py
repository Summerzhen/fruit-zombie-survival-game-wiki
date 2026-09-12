#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
import struct
import sys
from pathlib import Path

CORE_ROUTES = [
    "content/en/guide/how-to-finish-a-flight.mdx",
    "content/en/guide/how-to-land.mdx",
    "content/en/emergencies/emergency-guide.mdx",
]
IMAGE_RE = re.compile(r"!\[[^\]]*\]\((/images/[^)]+)\)")

def valid_source_url(url: str) -> bool:
    return bool(re.match(r"^https://(?:(?:www\.)?roblox\.com/games/|tr\.rbxcdn\.com/|[^/]+\.rbxcdn\.com/|[^/]*steampowered\.com/)", url))

def png_size(path: Path) -> tuple[int, int] | None:
    data = path.read_bytes()[:24]
    if len(data) < 24 or data[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    return struct.unpack(">II", data[16:24])

def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: visual-evidence-check.py <site-dir>", file=sys.stderr)
        return 2
    site = Path(sys.argv[1]).resolve()
    provenance_path = site / "audit/asset-provenance.json"
    failures: list[str] = []
    warnings: list[str] = []
    provenance = {}
    if provenance_path.exists():
        provenance = json.loads(provenance_path.read_text(encoding="utf-8-sig"))
    else:
        failures.append("missing audit/asset-provenance.json; official/captured media cannot be audited")
    known = {}
    for asset in provenance.get("assets", []) if isinstance(provenance, dict) else []:
        if isinstance(asset, dict) and asset.get("file"):
            known[str(asset["file"])] = asset
    for rel, asset in known.items():
        path = site / rel
        if not path.is_file():
            failures.append(f"missing provenance asset: {rel}")
            continue
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if asset.get("sha256") and digest != asset.get("sha256"):
            failures.append(f"asset hash mismatch: {rel}")
        if path.suffix.lower() == ".png":
            size = png_size(path)
            if not size:
                failures.append(f"asset is not a valid PNG: {rel}")
            elif min(size) < 240:
                warnings.append(f"small visual evidence asset: {rel} {size[0]}x{size[1]}")
        source_url = str(asset.get("sourceUrl") or "")
        if not source_url:
            failures.append(f"provenance asset lacks sourceUrl: {rel}")
        elif not valid_source_url(source_url):
            failures.append(f"official sourceUrl is not from an allowed source: {rel}")
    for mdx in (site / "content").rglob("*.mdx"):
        text = mdx.read_text(encoding="utf-8", errors="ignore")
        for image in IMAGE_RE.findall(text):
            rel = "public" + image
            if not (site / rel).is_file():
                failures.append(f"{mdx.relative_to(site).as_posix()}: missing local image {image}")
            if rel.startswith("public/images/official/") and rel not in known:
                failures.append(f"{mdx.relative_to(site).as_posix()}: official image lacks provenance {rel}")
    for route in CORE_ROUTES:
        path = site / route
        if path.exists() and not IMAGE_RE.search(path.read_text(encoding="utf-8", errors="ignore")):
            warnings.append(f"{route}: core guide has no local visual evidence image")
    if warnings:
        for warning in warnings[:80]:
            print(f"WARNING: {warning}")
    if failures:
        print("visual_evidence_check=failed")
        for failure in failures[:80]:
            print(f"ERROR: {failure}")
        return 1
    print("visual_evidence_check=ok")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
