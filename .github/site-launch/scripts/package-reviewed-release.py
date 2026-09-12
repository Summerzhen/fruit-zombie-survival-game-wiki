"""Transport the reviewed export and its evidence without rebuilding in CI.

The manifest detects accidental drift, not malicious edits by repository writers.
All quality gates still execute against the restored project before deployment.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import tarfile
from pathlib import Path, PurePosixPath

SCRIPTS = (
    'run-launch-gate.py', 'check-page-delivery.py', 'public-ui-residue-check.py',
    'content-contract-check.py', 'visual-evidence-check.py', 'player-facing-guide-gate.py',
    'game-site-content-audit.sh', 'visible-qa-check.sh', 'full-seo-audit.sh',
    'launch-quality-gate.py', 'canonical-origin-check.sh', 'live-release-gate.sh',
    'package-reviewed-release.py',
)
SOURCE_DIRS = ('src', 'content', 'public')
PROJECT_DIRS = ('requirements', 'content', 'evidence', 'audit', 'keywords')
CONFIG_SUFFIXES = {'.json', '.jsonc', '.js', '.mjs', '.cjs', '.ts', '.yaml', '.yml', '.lock'}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def permitted(path: Path) -> bool:
    parts = path.parts
    excluded_prefixes = {
        ('audit', 'codex', 'post-launch-live'),
        ('audit', 'gpt', 'post-launch-site-review'),
        ('audit', 'gpt', 'provided-capture'),
        ('codex', 'post-launch-live'),
        ('gpt', 'post-launch-site-review'),
        ('gpt', 'provided-capture'),
    }
    if any(parts[:len(prefix)] == prefix for prefix in excluded_prefixes):
        return False
    if path.as_posix() in {'audit/dual-review.json', 'dual-review.json'} or parts[:2] == ('audit', 'dual-review-prompts') or parts[:1] == ('dual-review-prompts',):
        return False
    return not any(p in {'.git', 'node_modules', '__pycache__', '.next', '.wrangler'}
                   or p.startswith('.env') or p.lower() in {'credentials.json', 'secrets.json'} for p in parts)


def files_under(folder: Path) -> set[Path]:
    if not folder.exists():
        return set()
    if folder.is_symlink():
        raise ValueError(f'Release snapshots do not accept symlink directories: {folder}')
    files = set()
    for path in folder.rglob('*'):
        if not permitted(path.relative_to(folder)):
            continue
        if path.is_symlink():
            raise ValueError(f'Release snapshots do not accept symlinks: {path}')
        if path.is_file():
            files.add(path)
    return files


def source_files(site: Path) -> set[Path]:
    files = set().union(*(files_under(site / name) for name in SOURCE_DIRS))
    for path in site.iterdir():
        if path.is_file() and path.suffix in CONFIG_SUFFIXES and permitted(Path(path.name)):
            if path.is_symlink():
                raise ValueError(f'Symlink configuration: {path}')
            files.add(path)
    return files


def hashes(files: set[Path], root: Path) -> dict[str, str]:
    return {p.relative_to(root).as_posix(): digest(p) for p in sorted(files)}


def package(project: Path, destination: Path, domain: str, controller: Path) -> None:
    site = project / 'site'
    if not all((site / 'out' / name).is_file() for name in ('index.html', 'sitemap.xml', 'robots.txt')):
        raise ValueError('Missing reviewed site/out export; build and review before packaging')
    if not (project / 'content/page-delivery.json').is_file():
        raise ValueError('Missing project content/page-delivery.json')
    files = source_files(site) | files_under(site / 'out')
    for name in PROJECT_DIRS:
        files |= files_under(project / name)
    # Legacy gates read these under site, delivery reads them under project.
    for name in ('audit', 'evidence', 'requirements', 'keywords'):
        files |= files_under(site / name)
    # Keep referenced project-local files without rewriting their hashes or paths.
    pending = [p for p in files if p.suffix == '.json']
    seen = set()
    while pending:
        path = pending.pop()
        if path in seen:
            continue
        seen.add(path)
        try:
            value = json.loads(path.read_text(encoding='utf-8-sig'))
        except (ValueError, UnicodeError):
            continue
        stack = [value]
        while stack:
            item = stack.pop()
            if isinstance(item, dict):
                stack.extend(item.values())
            elif isinstance(item, list):
                stack.extend(item)
            elif isinstance(item, str) and '\n' not in item and len(item) < 1024:
                candidate = project / item
                try:
                    exists = candidate.is_file()
                except (ValueError, OSError):
                    exists = False
                if not exists:
                    continue
                resolved = candidate.resolve()
                if project not in resolved.parents or Path(item).is_absolute():
                    raise ValueError(f'Evidence references must be project-relative, not host-specific: {path.name}')
                if not permitted(resolved.relative_to(project)) or candidate.is_symlink():
                    raise ValueError(f'Unsafe evidence reference in {path.name}')
                if resolved not in files:
                    files.add(resolved)
                    if resolved.suffix == '.json':
                        pending.append(resolved)
    destination.mkdir(parents=True, exist_ok=True)
    archive = destination / 'project.tar.gz'
    with tarfile.open(archive, 'w:gz') as tar:
        for path in sorted(files):
            tar.add(path, arcname=path.relative_to(project).as_posix(), recursive=False)
    if archive.stat().st_size >= 95 * 1024 * 1024:
        archive.unlink()
        raise ValueError('Release archive exceeds Git file budget (95 MiB); use artifact storage before deployment')
    manifest = {'version': 1, 'domain': domain, 'archiveSha256': digest(archive),
                'files': hashes(files, project), 'checkoutFiles': hashes(source_files(site), site)}
    (destination / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    tooling = site / '.github' / 'site-launch'
    (tooling / 'scripts').mkdir(parents=True, exist_ok=True)
    for name in SCRIPTS:
        shutil.copyfile(controller / 'scripts' / name, tooling / 'scripts' / name)
    (tooling / 'agent').mkdir(exist_ok=True)
    # The validator is stdlib-only; importing the controller's __init__ would pull store/runtime.
    (tooling / 'agent/__init__.py').write_text('', encoding='utf-8')
    for module in ('delivery_contract.py', 'interaction_contract.py'):
        shutil.copyfile(controller / 'agent' / module, tooling / 'agent' / module)


def restore(bundle: Path, checkout: Path, destination: Path) -> dict:
    manifest = json.loads((bundle / 'manifest.json').read_text(encoding='utf-8'))
    archive = bundle / 'project.tar.gz'
    if manifest.get('version') != 1 or digest(archive) != manifest.get('archiveSha256'):
        raise ValueError('Release archive changed or unsupported manifest')
    if hashes(source_files(checkout), checkout) != manifest.get('checkoutFiles'):
        raise ValueError('Checkout source/config changed since review; rebuild, review and package again')
    if destination.exists():
        raise ValueError('Restore destination must be new; do not overwrite another release')
    members = manifest.get('files')
    if not isinstance(members, dict) or not members:
        raise ValueError('Empty release manifest')
    with tarfile.open(archive) as tar:
        entries = tar.getmembers()
        names = [entry.name for entry in entries]
        if len(set(names)) != len(names) or set(names) != set(members):
            raise ValueError('Archive entries differ from manifest')
        for entry in entries:
            relative = PurePosixPath(entry.name)
            if not entry.isfile() or relative.is_absolute() or '..' in relative.parts or '\\' in entry.name or ':' in entry.name:
                raise ValueError('Unsafe archive entry')
        destination.mkdir(parents=True)
        for entry in entries:
            path = destination / entry.name
            path.parent.mkdir(parents=True, exist_ok=True)
            with tar.extractfile(entry) as source, path.open('wb') as target:
                shutil.copyfileobj(source, target)
            if digest(path) != members[entry.name]:
                raise ValueError(f'Restored file hash mismatch: {entry.name}')
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    pack = sub.add_parser('pack')
    pack.add_argument('project', type=Path)
    pack.add_argument('domain')
    unpack = sub.add_parser('restore')
    unpack.add_argument('checkout', type=Path)
    unpack.add_argument('destination', type=Path)
    args = parser.parse_args()
    try:
        if args.command == 'pack':
            project = args.project.resolve()
            package(project, project / 'site/.github/release', args.domain, Path(__file__).resolve().parents[1])
        else:
            checkout = args.checkout.resolve()
            restore(checkout / '.github/release', checkout, args.destination.resolve())
    except (ValueError, OSError, tarfile.TarError) as exc:
        parser.exit(1, f'reviewed_release=failed: {exc}\n')
    print('reviewed_release=ok')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
