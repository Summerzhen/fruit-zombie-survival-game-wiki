#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path


EXPECTED_TEMPLATE = "/root/Documents/同步/游戏站模版"
REQUIRED_TEMPLATE_FILES = [
    "package.json",
    "next.config.mjs",
    "src/config/game-site.ts",
    "src/components/site.tsx",
    "src/worker.ts",
    "src/locales/en.json",
]
FORBIDDEN_STATIC_RENDERERS = [
    "render-static-game-site.py",
    "probe-and-sync-render.py",
    "capture-static-visual-qa.py",
]


def load_json(path: Path) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8-sig"))
    except Exception as exc:
        raise ValueError(f"{path}: invalid JSON: {exc}") from exc
    if not isinstance(value, dict):
        raise ValueError(f"{path}: expected object")
    return value


def validate(site: Path) -> list[str]:
    errors: list[str] = []
    site = site.resolve()

    if site.name != "site":
        errors.append("site directory must be the project/site directory copied from the game template")

    for rel in REQUIRED_TEMPLATE_FILES:
        if not (site / rel).is_file():
            errors.append(f"missing required game-template file: {rel}")

    cfg = site / "src" / "config" / "game-site.ts"
    if cfg.is_file():
        text = cfg.read_text(encoding="utf-8", errors="ignore")
        if "GAME_SITE_CONFIG" not in text and "gameSite" not in text:
            errors.append("src/config/game-site.ts does not look like the game-site template config")

    provenance = site / "audit" / "template-source.json"
    if not provenance.is_file():
        errors.append("missing audit/template-source.json; create the site with scripts/copy-template.sh")
    else:
        try:
            payload = load_json(provenance)
        except ValueError as exc:
            errors.append(str(exc))
        else:
            template_path = str(payload.get("templatePath") or "")
            copied_by = str(payload.get("copiedBy") or "")
            if template_path != EXPECTED_TEMPLATE:
                errors.append(f"templatePath must be {EXPECTED_TEMPLATE}, got {template_path or '(missing)'}")
            if copied_by != "site-launch-agent/scripts/copy-template.sh":
                errors.append("template-source copiedBy must be scripts/copy-template.sh")

    repo_root = Path(__file__).resolve().parents[1]
    for name in FORBIDDEN_STATIC_RENDERERS:
        if (repo_root / "scripts" / name).exists():
            errors.append(f"forbidden lightweight static renderer remains in launch agent: scripts/{name}")

    return errors


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] in {"-h", "--help"}:
        print("Usage: game-template-contract-check.py <site-dir>", file=sys.stderr)
        return 2
    site = Path(sys.argv[1])
    if not site.is_dir():
        print(f"ERROR: site dir does not exist: {site}", file=sys.stderr)
        return 2
    errors = validate(site)
    if errors:
        print("game_template_contract=failed")
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("game_template_contract=ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
