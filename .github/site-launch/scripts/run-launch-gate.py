#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent


def run(command: list[str], cwd: Path, env: dict[str, str] | None = None, timeout: int = 20 * 60) -> tuple[int, str]:
    completed = subprocess.run(
        command,
        cwd=str(cwd),
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        timeout=timeout,
        check=False,
        env={**os.environ, **(env or {})},
    )
    return completed.returncode, completed.stdout


def bash_command(script: Path, *args: str) -> list[str]:
    # Resolve at execution, after the Python delivery checks have run.
    bash = shutil.which("bash") or "bash"
    return [bash, str(script), *args]


def node_bin(site: Path, name: str) -> list[str]:
    suffix = ".cmd" if os.name == "nt" else ""
    candidate = site / "node_modules" / ".bin" / f"{name}{suffix}"
    if candidate.exists():
        return [str(candidate)]
    return [name]


def remove_exported_locale_dirs(site: Path) -> None:
    out = (site / "out").resolve()
    for name in ("en", "ads"):
        target = (out / name).resolve()
        if target.exists():
            if out not in target.parents:
                raise RuntimeError(f"Refusing to remove path outside out/: {target}")
            shutil.rmtree(target)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the shared Site Launch Agent quality gate")
    parser.add_argument("site_dir", type=Path)
    parser.add_argument("domain")
    parser.add_argument("--phase", choices=("qa", "predeploy"), default="predeploy")
    parser.add_argument("--skip-build", action="store_true")
    parser.add_argument("--project-dir", type=Path, help="Project containing requirements/, content/ and site/; required when it is not site_dir.parent")
    args = parser.parse_args()

    site = args.site_dir.resolve()
    project = (args.project_dir or site.parent).resolve()
    if not site.is_dir():
        print(f"ERROR: site directory is missing: {site}", file=sys.stderr)
        return 2
    if (project / "site").resolve() != site:
        print("ERROR: delivery review requires project/site layout; pass the reviewed project with --project-dir", file=sys.stderr)
        return 2
    if args.skip_build and not all((site / "out" / name).is_file() for name in ("index.html", "sitemap.xml", "robots.txt")):
        print("ERROR: reviewed static export missing; build and collect review before predeploy", file=sys.stderr)
        return 2

    commands: list[tuple[str, list[str], dict[str, str] | None]] = []
    if not args.skip_build:
        if not (site / "node_modules").is_dir():
            commands.append(("npm ci", ["npm", "ci"], None))
        commands.append(("typecheck", [*node_bin(site, "tsc"), "--noEmit"], None))
        commands.append(("build", ["npm", "run", "build"], None))
    commands.append(("page delivery", [sys.executable, str(SCRIPT_DIR / "check-page-delivery.py"), str(project), "--phase", "release"], None))

    python_scripts = [
        "game-template-contract-check.py",
        "public-ui-residue-check.py",
        "content-contract-check.py",
        "visual-evidence-check.py",
        "player-facing-guide-gate.py",
    ]
    for script in python_scripts:
        commands.append((script, [sys.executable, str(SCRIPT_DIR / script), str(site)], None))

    output_parts: list[str] = []
    try:
        commands.extend(
            [
                (
                    "game-site-content-audit.sh",
                    bash_command(SCRIPT_DIR / "game-site-content-audit.sh", str(site), args.domain),
                    {"GAME_SITE_CONTENT_AUDIT_ALLOW_YOUTUBE": "1", "GAME_SITE_CONTENT_AUDIT_ALLOW_OFFICIAL": "1"},
                ),
                ("visible-qa-check.sh", bash_command(SCRIPT_DIR / "visible-qa-check.sh", str(site), args.domain), None),
                ("full-seo-audit.sh", bash_command(SCRIPT_DIR / "full-seo-audit.sh", str(site), args.domain), None),
                ("launch-quality-gate.py", [sys.executable, str(SCRIPT_DIR / "launch-quality-gate.py"), str(site)], None),
            ]
        )
        for label, command, env in commands:
            code, output = run(command, site, env=env)
            output_parts.append(f"===== {label} =====\n{output}")
            if code != 0:
                print("\n".join(output_parts)[-30000:])
                print(f"launch_gate=failed step={label}", file=sys.stderr)
                return code
            if label == "build":
                remove_exported_locale_dirs(site)
                if not (site / "out" / "sitemap.xml").is_file():
                    print("ERROR: out/sitemap.xml missing", file=sys.stderr)
                    return 1
                if not (site / "out" / "robots.txt").is_file():
                    print("ERROR: out/robots.txt missing", file=sys.stderr)
                    return 1
    except (RuntimeError, OSError, subprocess.TimeoutExpired) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    print("\n".join(output_parts)[-30000:])
    print(f"launch_gate=ok phase={args.phase} domain={args.domain}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
